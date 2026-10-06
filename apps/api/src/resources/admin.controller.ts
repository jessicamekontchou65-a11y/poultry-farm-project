import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ResourcesService } from "./resources.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly resources: ResourcesService) {}

  @Get("dashboard")
  async dashboard() {
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
      this.resources.count("users"),
      this.resources.count("farms"),
      this.resources.count("shops"),
      this.resources.count("products"),
      this.resources.count("orders"),
      this.resources.count("farms", { verificationStatus: "pending" }),
      this.resources.count("shops", { verificationStatus: "pending" }),
      this.resources.count("products", { approvalStatus: "pending" })
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

  @Patch(":resource/:id/approve")
  approve(@Param("resource") resource: "farms" | "shops" | "products", @Param("id") id: string) {
    return this.resources.moderate(resource, id, "approve");
  }

  @Patch(":resource/:id/reject")
  reject(
    @Param("resource") resource: "farms" | "shops" | "products",
    @Param("id") id: string,
    @Body("reason") reason?: string
  ) {
    return this.resources.moderate(resource, id, "reject", reason);
  }

  @Patch(":resource/:id/suspend")
  suspend(@Param("resource") resource: "farms" | "shops" | "products", @Param("id") id: string) {
    return this.resources.moderate(resource, id, "suspend");
  }
}
