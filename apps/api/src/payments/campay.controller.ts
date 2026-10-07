import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUser, DomainService } from "../resources/domain.service";

@Controller("payments/campay")
export class CampayController {
  constructor(private readonly domain: DomainService) {}

  @UseGuards(JwtAuthGuard)
  @Post("initiate")
  initiate(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.domain.initiateCampayPayment(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("status/:paymentId")
  status(@CurrentUser() user: AuthUser, @Param("paymentId") paymentId: string) {
    return this.domain.refreshCampayPayment(user, paymentId);
  }

  // CamPay calls the webhook URL configured in its dashboard with GET query params.
  @Get("webhook")
  webhookGet(@Query() query: Record<string, unknown>) {
    return this.domain.handleCampayWebhook(query);
  }

  @Post("webhook")
  webhookPost(@Query() query: Record<string, unknown>, @Body() body: Record<string, unknown>) {
    return this.domain.handleCampayWebhook({ ...query, ...body });
  }
}
