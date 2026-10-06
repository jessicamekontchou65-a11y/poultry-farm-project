import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ResourcesService, ListQuery } from "./resources.service";

@Controller("resources")
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  index() {
    return { data: this.resources.resourceKeys() };
  }

  @Get(":resource")
  list(@Param("resource") resource: string, @Query() query: ListQuery) {
    return this.resources.list(resource, query);
  }

  @Get(":resource/:id")
  findOne(@Param("resource") resource: string, @Param("id") id: string) {
    return this.resources.findOne(resource, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":resource")
  create(@Param("resource") resource: string, @Body() body: Record<string, unknown>) {
    return this.resources.create(resource, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":resource/:id")
  update(
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.resources.update(resource, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":resource/:id")
  remove(@Param("resource") resource: string, @Param("id") id: string) {
    return this.resources.remove(resource, id);
  }
}
