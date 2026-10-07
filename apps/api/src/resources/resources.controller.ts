import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtGuard } from "../common/guards/optional-jwt.guard";
import { AuthUser, DomainService } from "./domain.service";
import { publicResources } from "./resource-map";
import { ResourcesService, ListQuery } from "./resources.service";

// Profile fields a user may change on their own account.
const SELF_EDITABLE_USER_FIELDS = ["fullName", "phone", "avatar", "address", "city", "region", "country", "roles"];
// Roles a user may add to themselves; admin roles are granted by admins only.
const SELF_ASSIGNABLE_ROLES = new Set(["customer", "farmer", "shopkeeper"]);
// What any signed-in user may see about another user (e.g. a product's seller).
const PUBLIC_USER_FIELDS = ["_id", "fullName", "email", "phone", "avatar", "city", "region", "country", "roles"];
// Batch fields the owning farmer may patch directly.
const OWNER_BLOCKED_BATCH_FIELDS = ["_id", "farmId", "createdAt", "updatedAt"];

/**
 * Generic CRUD over every collection. Admins have full access; everyone else
 * gets read access to public catalog resources plus a few owner-scoped cases.
 */
@Controller("resources")
export class ResourcesController {
  constructor(
    private readonly resources: ResourcesService,
    private readonly domain: DomainService
  ) {}

  @Get()
  index() {
    return { data: this.resources.resourceKeys() };
  }

  @UseGuards(OptionalJwtGuard)
  @Get(":resource")
  list(
    @CurrentUser() user: AuthUser | null,
    @Param("resource") resource: string,
    @Query() query: ListQuery
  ) {
    if (!publicResources.has(resource)) this.assertAdmin(user);
    return this.resources.list(resource, query);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(":resource/:id")
  async findOne(
    @CurrentUser() user: AuthUser | null,
    @Param("resource") resource: string,
    @Param("id") id: string
  ) {
    if (publicResources.has(resource) || this.isAdmin(user)) {
      return this.resources.findOne(resource, id);
    }
    if (!user) throw new ForbiddenException("Authentication required");

    if (resource === "users") {
      const result = await this.resources.findOne("users", id);
      if (id === user.id) return result;
      return { data: pick(result.data as Record<string, unknown>, PUBLIC_USER_FIELDS) };
    }
    if (resource === "batches") {
      await this.domain.assertBatchAccess(user, id, { allowInactive: true });
      return this.resources.findOne("batches", id);
    }
    throw new ForbiddenException("You cannot access this resource");
  }

  @UseGuards(JwtAuthGuard)
  @Post(":resource")
  create(
    @CurrentUser() user: AuthUser,
    @Param("resource") resource: string,
    @Body() body: Record<string, unknown>
  ) {
    this.assertAdmin(user);
    return this.resources.create(resource, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":resource/:id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    if (this.isAdmin(user)) {
      const { passwordHash: _ignored, ...patch } = body;
      return this.resources.update(resource, id, patch);
    }

    if (resource === "users" && id === user.id) {
      const patch = pick(body, SELF_EDITABLE_USER_FIELDS);
      if (patch.roles !== undefined) {
        const roles = Array.isArray(patch.roles) ? patch.roles.map(String) : [];
        if (!roles.length || roles.some((role) => !SELF_ASSIGNABLE_ROLES.has(role))) {
          throw new ForbiddenException("You cannot assign these roles to yourself");
        }
        // Keep any admin role the user already holds.
        patch.roles = Array.from(new Set([...user.roles.filter((r) => !SELF_ASSIGNABLE_ROLES.has(r)), ...roles]));
      }
      return this.resources.update("users", id, patch);
    }

    if (resource === "batches") {
      await this.domain.assertBatchAccess(user, id, { allowInactive: true });
      const patch = { ...body };
      for (const field of OWNER_BLOCKED_BATCH_FIELDS) delete patch[field];
      return this.resources.update("batches", id, patch);
    }

    throw new ForbiddenException("You cannot modify this resource");
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":resource/:id")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("resource") resource: string,
    @Param("id") id: string
  ) {
    this.assertAdmin(user);
    return this.resources.remove(resource, id);
  }

  private isAdmin(user: AuthUser | null) {
    return !!user && this.domain.isAdmin(user);
  }

  private assertAdmin(user: AuthUser | null) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException("Administrator access required");
    }
  }
}

function pick(source: Record<string, unknown>, fields: string[]) {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (source[field] !== undefined) result[field] = source[field];
  }
  return result;
}
