import { createHmac, timingSafeEqual } from "node:crypto";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
  UseGuards
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtGuard } from "../common/guards/optional-jwt.guard";
import { parseCoordinates } from "../common/coordinates";
import { RolesGuard } from "../common/guards/roles.guard";
import { schemaNames } from "../database/schema-names";
import { AuthUser, DomainService } from "./domain.service";
import { ListQuery, ResourcesService } from "./resources.service";

// Fields only admins (moderation) or the server may set on owned listings.
const OWNER_BLOCKED_FIELDS = [
  "_id",
  "ownerId",
  "verificationStatus",
  "approvalStatus",
  "rejectionReason",
  "createdAt",
  "updatedAt"
];

@Controller()
export class SrsController {
  constructor(
    private readonly resources: ResourcesService,
    private readonly domain: DomainService,
    private readonly config: ConfigService
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
      ...omit(body, OWNER_BLOCKED_FIELDS),
      coordinates: parseCoordinates(body.coordinates) ?? undefined,
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
      ...omit(body, OWNER_BLOCKED_FIELDS),
      coordinates: parseCoordinates(body.coordinates) ?? undefined,
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
  async updateShop(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    await this.domain.assertShopAccess(user, id);
    const patch = omit(body, OWNER_BLOCKED_FIELDS);
    const coordinates = parseCoordinates(body.coordinates);
    if (coordinates !== undefined) patch.coordinates = coordinates;
    return this.resources.update("shops", id, patch);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("shops/:id")
  async deleteShop(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    await this.domain.assertShopAccess(user, id);
    return this.resources.remove("shops", id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("products")
  createProduct(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.resources.create("products", {
      ...omit(body, OWNER_BLOCKED_FIELDS),
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

  @UseGuards(OptionalJwtGuard)
  @Get("products/:id")
  product(@CurrentUser() user: AuthUser | null, @Param("id") id: string) {
    return this.domain.getProductWithSeller(id, !!user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("products/:id")
  async updateProduct(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    await this.domain.assertProductAccess(user, id);
    return this.resources.update("products", id, omit(body, OWNER_BLOCKED_FIELDS));
  }

  @UseGuards(JwtAuthGuard)
  @Delete("products/:id")
  async deleteProduct(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    await this.domain.assertProductAccess(user, id);
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
  async order(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return { data: await this.domain.getOrderForUser(user, id) };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("orders/:id/status")
  updateOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.updateOrderStatus(user, id, body.orderStatus);
  }

  @UseGuards(JwtAuthGuard)
  @Post("payments/initiate")
  createPayment(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.createPayment(user, body);
  }

  @Post("payments/callback")
  paymentCallback(
    @Req() request: { rawBody?: Buffer },
    @Headers("x-payment-signature") signature: string | undefined,
    @Body() body: Record<string, unknown>
  ) {
    this.verifyPaymentSignature(request.rawBody, signature);
    return this.domain.markPaymentCallback(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("payments/order/:orderId")
  async orderPayments(
    @CurrentUser() user: AuthUser,
    @Param("orderId") orderId: string,
    @Query() query: ListQuery
  ) {
    await this.domain.getOrderForUser(user, orderId);
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
  async productReviews(@Param("productId") productId: string, @Query() query: ListQuery) {
    return this.domain.withReviewerNames(
      await this.resources.list("reviews", { ...query, productId, status: "published" })
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("reports/farmer/overview")
  farmerReport(@CurrentUser() user: AuthUser) {
    return this.domain.farmerOverview(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @Get("reports/admin/overview")
  adminReport() {
    return this.resources.platformOverview();
  }

  /** Payment providers must sign the raw callback body with HMAC-SHA256(PAYMENT_SECRET), hex encoded. */
  private verifyPaymentSignature(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = this.config.get<string>("PAYMENT_SECRET")?.trim();
    if (!secret) {
      throw new ServiceUnavailableException("Payment callbacks are not configured");
    }
    if (!rawBody || !signature) {
      throw new ForbiddenException("Missing payment signature");
    }
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    const received = Buffer.from(signature.trim(), "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new ForbiddenException("Invalid payment signature");
    }
  }
}

function omit(source: Record<string, unknown>, fields: string[]) {
  const result = { ...source };
  for (const field of fields) delete result[field];
  return result;
}
