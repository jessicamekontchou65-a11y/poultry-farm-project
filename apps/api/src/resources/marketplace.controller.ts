import { Controller, Get, Param, Query } from "@nestjs/common";
import { ListQuery, ResourcesService } from "./resources.service";

@Controller()
export class MarketplaceController {
  constructor(private readonly resources: ResourcesService) {}

  @Get("marketplace")
  products(@Query() query: ListQuery) {
    return this.resources.list("products", {
      ...query,
      approvalStatus: "approved",
      status: query.status ?? "available"
    });
  }

  @Get("products/:id")
  product(@Param("id") id: string) {
    return this.resources.findOne("products", id);
  }

  @Get("farms")
  farms(@Query() query: ListQuery) {
    return this.resources.list("farms", {
      ...query,
      verificationStatus: "approved",
      status: query.status ?? "active"
    });
  }

  @Get("farms/:id")
  farm(@Param("id") id: string) {
    return this.resources.findOne("farms", id);
  }

  @Get("shops")
  shops(@Query() query: ListQuery) {
    return this.resources.list("shops", {
      ...query,
      verificationStatus: "approved",
      status: query.status ?? "active"
    });
  }

  @Get("shops/:id")
  shop(@Param("id") id: string) {
    return this.resources.findOne("shops", id);
  }
}
