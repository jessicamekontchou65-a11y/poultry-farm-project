import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { DomainService } from "./domain.service";

type MapQuery = { type?: "farm" | "shop" | "all"; region?: string };

/** Positions of farms and shops for the OpenStreetMap views. */
@Controller()
export class MapController {
  constructor(private readonly domain: DomainService) {}

  /** Approved, active farms and shops — what buyers can visit. */
  @Get("map/locations")
  locations(@Query() query: MapQuery) {
    return this.domain.mapLocations({ type: query.type, region: query.region });
  }

  /** Every farm and shop, including pending and rejected ones, with the owner's name. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Get("admin/map/locations")
  adminLocations(@Query() query: MapQuery) {
    return this.domain.mapLocations({ type: query.type, region: query.region, includeAll: true });
  }
}
