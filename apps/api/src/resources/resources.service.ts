import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { resourceMap } from "./resource-map";

export interface ListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  [key: string]: string | undefined;
}

// Fields that must never leave the API, whoever asks.
const HIDDEN_FIELDS: Record<string, string> = {
  users: "-passwordHash"
};

const SAFE_FIELD_NAME = /^[A-Za-z][A-Za-z0-9_.]*$/;

@Injectable()
export class ResourcesService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  resourceKeys() {
    return Object.keys(resourceMap).sort();
  }

  async list(resource: string, query: ListQuery = {}) {
    const model = this.getModel(resource);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;
    const filter = this.buildFilter(query);
    const sortField = query.sort && SAFE_FIELD_NAME.test(query.sort) ? query.sort : "createdAt";
    const sortOrder = query.order === "asc" ? 1 : -1;

    if (query.search && resource === "products") {
      filter.$text = { $search: query.search };
    }

    const [data, total] = await Promise.all([
      model
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select(HIDDEN_FIELDS[resource] ?? {})
        .lean(),
      model.countDocuments(filter)
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(resource: string, id: string) {
    const model = this.getModel(resource);
    this.assertObjectId(id);
    const data = await model.findById(id).select(HIDDEN_FIELDS[resource] ?? {}).lean();

    if (!data) {
      throw new NotFoundException(`${resource} record not found`);
    }

    return { data };
  }

  async create(resource: string, payload: Record<string, unknown>) {
    const model = this.getModel(resource);
    const created = await model.create(payload);
    const data = created.toObject();
    if (resource === "users") delete data.passwordHash;
    return { data };
  }

  async update(resource: string, id: string, payload: Record<string, unknown>) {
    const model = this.getModel(resource);
    this.assertObjectId(id);
    const data = await model
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .select(HIDDEN_FIELDS[resource] ?? {})
      .lean();

    if (!data) {
      throw new NotFoundException(`${resource} record not found`);
    }

    return { data };
  }

  async remove(resource: string, id: string) {
    const model = this.getModel(resource);
    this.assertObjectId(id);
    const data = await model.findByIdAndUpdate(
      id,
      { status: "deleted" },
      { new: true }
    );

    if (!data) {
      throw new NotFoundException(`${resource} record not found`);
    }

    return { data: { id, deleted: true } };
  }

  async count(resource: string, filter: Record<string, unknown> = {}) {
    return this.getModel(resource).countDocuments(filter);
  }

  async ownerOverview(ownerId: string) {
    const [
      farms,
      shops,
      products,
      orders,
      expenses,
      farmSales,
      notifications
    ] = await Promise.all([
      this.count("farms", { ownerId }),
      this.count("shops", { ownerId }),
      this.count("products", { ownerId }),
      this.count("orders", { customerId: ownerId }),
      this.count("expenses", { ownerId }),
      this.count("farm-sales", { ownerId }),
      this.count("notifications", { userId: ownerId, readAt: { $exists: false } })
    ]);

    return {
      data: {
        farms,
        shops,
        products,
        orders,
        expenses,
        farmSales,
        unreadNotifications: notifications
      }
    };
  }

  async platformOverview() {
    const [
      totalUsers,
      totalFarms,
      totalShops,
      totalProducts,
      totalOrders,
      pendingFarms,
      pendingShops,
      pendingProducts
    ] = await Promise.all([
      this.count("users"),
      this.count("farms"),
      this.count("shops"),
      this.count("products"),
      this.count("orders"),
      this.count("farms", { verificationStatus: "pending" }),
      this.count("shops", { verificationStatus: "pending" }),
      this.count("products", { approvalStatus: "pending" })
    ]);

    return {
      data: {
        totalUsers,
        totalFarms,
        totalShops,
        totalProducts,
        totalOrders,
        pendingFarms,
        pendingShops,
        pendingProducts
      }
    };
  }

  async moderate(
    resource: "farms" | "shops" | "products",
    id: string,
    action: "approve" | "reject" | "suspend",
    reason?: string
  ) {
    const statusPatch =
      resource === "products"
        ? this.productModerationPatch(action, reason)
        : this.businessModerationPatch(action, reason);

    return this.update(resource, id, statusPatch);
  }

  private getModel(resource: string): Model<any> {
    const schemaName = resourceMap[resource];
    if (!schemaName) {
      throw new NotFoundException(`Unknown resource: ${resource}`);
    }

    return this.connection.model(schemaName);
  }

  private buildFilter(query: ListQuery) {
    const filter: Record<string, any> = {};
    const excluded = new Set(["page", "limit", "sort", "order", "search", "fromDate", "toDate"]);

    for (const [key, value] of Object.entries(query)) {
      // Only plain string equality filters on ordinary field names: no operators.
      if (!value || typeof value !== "string" || excluded.has(key) || !SAFE_FIELD_NAME.test(key)) {
        continue;
      }

      filter[key] = this.looksLikeObjectId(value) ? new Types.ObjectId(value) : value;
    }

    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) {
        filter.createdAt.$gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        filter.createdAt.$lte = new Date(query.toDate);
      }
    }

    return filter;
  }

  private productModerationPatch(action: "approve" | "reject" | "suspend", reason?: string) {
    if (action === "approve") {
      return { approvalStatus: "approved", status: "available", rejectionReason: undefined };
    }
    if (action === "reject") {
      return { approvalStatus: "rejected", status: "hidden", rejectionReason: reason };
    }
    return { status: "hidden" };
  }

  private businessModerationPatch(action: "approve" | "reject" | "suspend", reason?: string) {
    if (action === "approve") {
      return { verificationStatus: "approved", status: "active", rejectionReason: undefined };
    }
    if (action === "reject") {
      return { verificationStatus: "rejected", status: "inactive", rejectionReason: reason };
    }
    return { status: "suspended" };
  }

  private assertObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid id");
    }
  }

  private looksLikeObjectId(value: string) {
    return Types.ObjectId.isValid(value) && value.length === 24;
  }
}
