import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { schemaNames } from "../database/schema-names";
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
    if (!["farms", "shops", "products"].includes(resource)) {
      throw new BadRequestException("Only farms, shops and products can be moderated");
    }
    if (!["approve", "reject", "suspend"].includes(action)) {
      throw new BadRequestException("Unknown moderation action");
    }
    const statusPatch =
      resource === "products"
        ? this.productModerationPatch(action, reason)
        : this.businessModerationPatch(action, reason);

    const result = await this.update(resource, id, statusPatch);
    await this.notifyOwner(resource, action, result.data as Record<string, any>, reason);
    return result;
  }

  /** Tells the farmer or shopkeeper what the admin decided about their farm, shop or product. */
  private async notifyOwner(
    resource: "farms" | "shops" | "products",
    action: "approve" | "reject" | "suspend",
    record: Record<string, any>,
    reason?: string
  ) {
    if (!record?.ownerId) return;
    const name = String(record.name ?? "");
    const kind = {
      farms: { en: "farm", fr: "ferme" },
      shops: { en: "shop", fr: "boutique" },
      products: { en: "product", fr: "produit" }
    }[resource];
    const link = { farms: "/dashboard/farmer/farms", shops: "/dashboard/shopkeeper/shops", products: "/dashboard/farmer/products" }[resource];
    const reasonEn = reason ? ` Reason: ${reason}` : "";
    const reasonFr = reason ? ` Motif : ${reason}` : "";
    const fem = resource !== "products"; // ferme, boutique

    const messages = {
      approve: {
        en: { title: `Your ${kind.en} is approved`, body: `“${name}” is now approved and visible to customers.` },
        fr: { title: `Votre ${kind.fr} est approuvé${fem ? "e" : ""}`, body: `« ${name} » est maintenant approuvé${fem ? "e" : ""} et visible par les clients.` }
      },
      reject: {
        en: { title: `Your ${kind.en} was not approved`, body: `“${name}” was not approved.${reasonEn} You can update it and submit again.` },
        fr: { title: `Votre ${kind.fr} n'a pas été approuvé${fem ? "e" : ""}`, body: `« ${name} » n'a pas été approuvé${fem ? "e" : ""}.${reasonFr} Vous pouvez ${fem ? "la" : "le"} modifier et ${fem ? "la" : "le"} soumettre à nouveau.` }
      },
      suspend: {
        en: { title: `Your ${kind.en} was suspended`, body: `“${name}” has been suspended by an administrator.${reasonEn}` },
        fr: { title: `Votre ${kind.fr} a été suspendu${fem ? "e" : ""}`, body: `« ${name} » a été suspendu${fem ? "e" : ""} par un administrateur.${reasonFr}` }
      }
    }[action];

    try {
      await this.connection.model(schemaNames.Notification).create({
        userId: record.ownerId,
        type: `moderation_${action}`,
        title: messages.en.title,
        body: messages.en.body,
        data: { resource, id: String(record._id), action, reason, link, i18n: messages }
      });
    } catch (err) {
      // The decision is already saved; a failed notification must not undo it.
      console.warn("Could not create moderation notification:", err);
    }
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
