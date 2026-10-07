import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthUser } from "../resources/domain.service";
import { KnowledgeService } from "./knowledge.service";

/** Public Poultry Knowledge Center: anyone can read published guidance. */
@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get("sections")
  sections() {
    return this.knowledge.sections();
  }

  @Get("articles")
  list(@Query() query: { section?: string; q?: string; poultryType?: string }) {
    return this.knowledge.list(query);
  }

  @Get("articles/:slug")
  article(@Param("slug") slug: string) {
    return this.knowledge.get(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get("for-my-flocks")
  forMyFlocks(@CurrentUser() user: AuthUser) {
    return this.knowledge.forMyFlocks(user);
  }
}

/** Content management for admins; changes are live without a redeploy. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@Controller("admin/knowledge")
export class KnowledgeAdminController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list(@Query() query: { section?: string; q?: string }) {
    return this.knowledge.list(query, true);
  }

  @Get(":slug")
  article(@Param("slug") slug: string) {
    return this.knowledge.get(slug, true);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.knowledge.create(user, body);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.knowledge.update(user, id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.knowledge.remove(id);
  }
}
