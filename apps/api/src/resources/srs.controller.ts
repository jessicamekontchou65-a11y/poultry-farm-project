import {
  BadRequestException,
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
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { schemaNames } from "../database/schema-names";
import { AuthUser, DomainService } from "./domain.service";
import { ListQuery, ResourcesService } from "./resources.service";

@Controller()
export class SrsController {
  constructor(
    private readonly resources: ResourcesService,
    private readonly domain: DomainService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("farms")
  createFarm(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    if (!body.verificationDocument || !body.verificationDocumentName) {
      throw new BadRequestException(
        "An official document proving this farm is required"
      );
    }
    return this.resources.create("farms", {
      ...body,
      ownerId: user.id,
      verificationStatus: "pending"
    });
  }

  @Get("farms")
  farms(@Query() query: ListQuery) {
    return this.resources.list("farms", {
      ...query,
      verificationStatus: query.verificationStatus ?? "approved",
      status: query.status ?? "active"
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("farms/my")
  myFarms(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("farms", {
      ...query,
      ownerId: user.id
    });
  }

  @Get("farms/:id")
  farm(@Param("id") id: string) {
    return this.resources.findOne("farms", id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("farms/:id")
  updateFarm(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.updateFarm(user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("farms/:id")
  deleteFarm(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.domain.softDeleteFarm(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("shops")
  createShop(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    if (!body.verificationDocument || !body.verificationDocumentName) {
      throw new BadRequestException(
        "An official document proving this shop is required"
      );
    }
    return this.resources.create("shops", {
      ...body,
      ownerId: user.id,
      verificationStatus: "pending"
    });
  }

  @Get("shops")
  shops(@Query() query: ListQuery) {
    return this.resources.list("shops", {
      ...query,
      verificationStatus: query.verificationStatus ?? "approved",
      status: query.status ?? "active"
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("shops/my")
  myShops(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("shops", {
      ...query,
      ownerId: user.id
    });
  }

  @Get("shops/:id")
  shop(@Param("id") id: string) {
    return this.resources.findOne("shops", id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("shops/:id")
  updateShop(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.resources.update("shops", id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("shops/:id")
  deleteShop(@Param("id") id: string) {
    return this.resources.remove("shops", id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("products")
  createProduct(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.resources.create("products", {
      ...body,
      ownerId: user.id
    });
  }

  @Get("products")
  products(@Query() query: ListQuery) {
    return this.resources.list("products", query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("products/my")
  myProducts(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("products", {
      ...query,
      ownerId: user.id
    });
  }

  @Get("products/:id")
  product(@Param("id") id: string) {
    return this.resources.findOne("products", id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("products/:id")
  updateProduct(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.resources.update("products", id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("products/:id")
  deleteProduct(@Param("id") id: string) {
    return this.resources.remove("products", id);
  }

  @Get("categories")
  categories(@Query() query: ListQuery) {
    return this.resources.list("categories", query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("orders")
  createOrder(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createOrdersFromCart(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/my")
  myOrders(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("orders", {
      ...query,
      customerId: user.id
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/seller")
  sellerOrders(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("orders", {
      ...query,
      sellerId: user.id
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/:id")
  order(@Param("id") id: string) {
    return this.resources.findOne("orders", id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("orders/:id/status")
  updateOrderStatus(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.resources.update("orders", id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("payments/initiate")
  createPayment(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createPayment(user, body);
  }

  @Post("payments/callback")
  paymentCallback(@Body() body: Record<string, unknown>) {
    return this.domain.markPaymentCallback(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("payments/order/:orderId")
  orderPayments(@Param("orderId") orderId: string, @Query() query: ListQuery) {
    return this.resources.list("payments", {
      ...query,
      orderId
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("notifications")
  notifications(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("notifications", {
      ...query,
      userId: user.id
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch("notifications/:id/read")
  readNotification(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.domain.markNotificationRead(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("notifications/read-all")
  readAllNotifications(@CurrentUser() user: AuthUser) {
    return this.domain.markNotificationRead(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("farms/:farmId/batches")
  createBatch(
    @CurrentUser() user: AuthUser,
    @Param("farmId") farmId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.createBatch(user, farmId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("farms/:farmId/batches")
  farmBatches(
    @CurrentUser() user: AuthUser,
    @Param("farmId") farmId: string,
    @Query() query: ListQuery
  ) {
    return this.domain.listFarmBatches(user, farmId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("batches/:id/close")
  closeBatch(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.domain.closeBatch(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("batches/:batchId/feeding-records")
  createFeeding(
    @CurrentUser() user: AuthUser,
    @Param("batchId") batchId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.createFeedingRecord(user, batchId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("batches/:batchId/feeding-records")
  feedingRecords(@CurrentUser() user: AuthUser, @Param("batchId") batchId: string, @Query() query: ListQuery) {
    return this.domain.listBatchRecords(user, schemaNames.FeedingRecord, batchId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("batches/:batchId/mortality-records")
  createMortality(
    @CurrentUser() user: AuthUser,
    @Param("batchId") batchId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.createMortalityRecord(user, batchId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("batches/:batchId/mortality-records")
  mortalityRecords(@CurrentUser() user: AuthUser, @Param("batchId") batchId: string, @Query() query: ListQuery) {
    return this.domain.listBatchRecords(user, schemaNames.MortalityRecord, batchId, query);
  }

  @Get("outbreaks/heatmap")
  outbreakHeatmap(@Query() query: ListQuery) {
    return this.domain.outbreakHeatmap(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("batches/:batchId/vaccination-records")
  createVaccination(
    @CurrentUser() user: AuthUser,
    @Param("batchId") batchId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.createVaccinationRecord(user, batchId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("batches/:batchId/vaccination-records")
  vaccinationRecords(@CurrentUser() user: AuthUser, @Param("batchId") batchId: string, @Query() query: ListQuery) {
    return this.domain.listBatchRecords(user, schemaNames.VaccinationRecord, batchId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("vaccination-records/:id/complete")
  completeVaccination(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.completeVaccination(user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("batches/:batchId/egg-production-records")
  createEggProduction(
    @CurrentUser() user: AuthUser,
    @Param("batchId") batchId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.createEggProductionRecord(user, batchId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("batches/:batchId/egg-production-records")
  eggProductionRecords(@CurrentUser() user: AuthUser, @Param("batchId") batchId: string, @Query() query: ListQuery) {
    return this.domain.listBatchRecords(user, schemaNames.EggProductionRecord, batchId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("expenses")
  createExpense(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createExpense(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("expenses")
  expenses(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.resources.list("expenses", { ...query, ownerId: user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Post("farm-sales")
  createFarmSale(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createFarmSale(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("farm-sales")
  farmSales(@Query() query: ListQuery) {
    return this.resources.list("farm-sales", query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("cart")
  cart(@CurrentUser() user: AuthUser) {
    return this.domain.getCart(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("cart/items")
  addCartItem(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.addCartItem(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("cart/items/:itemId")
  updateCartItem(
    @CurrentUser() user: AuthUser,
    @Param("itemId") itemId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.updateCartItem(user, itemId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("cart/items/:itemId")
  removeCartItem(@CurrentUser() user: AuthUser, @Param("itemId") itemId: string) {
    return this.domain.removeCartItem(user, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("cart")
  clearCart(@CurrentUser() user: AuthUser) {
    return this.domain.removeCartItem(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("conversations")
  createConversation(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createConversation(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("conversations")
  conversations(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    return this.domain.listConversations(user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("conversations/:id/messages")
  createMessage(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.createMessage(user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("conversations/:id/messages")
  messages(@CurrentUser() user: AuthUser, @Param("id") id: string, @Query() query: ListQuery) {
    return this.domain.listMessages(user, id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("reviews")
  createReview(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createReview(user, body);
  }

  @Get("reviews/product/:productId")
  productReviews(@Param("productId") productId: string, @Query() query: ListQuery) {
    return this.resources.list("reviews", { ...query, productId, status: "published" });
  }

  @UseGuards(JwtAuthGuard)
  @Get("reports/farmer/overview")
  farmerReport(@CurrentUser() user: AuthUser) {
    return this.resources.ownerOverview(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Get("reports/admin/overview")
  adminReport() {
    return this.resources.platformOverview();
  }
}
