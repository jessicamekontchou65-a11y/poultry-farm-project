import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUser, DomainService } from "./domain.service";

/**
 * Farm Operations (Farm Management Phases 1–2)
 * Hub context/summary + batch/farm updates.
 * Daily record mutations remain on existing /batches/... and /expenses routes.
 */
@Controller("farm-ops")
@UseGuards(JwtAuthGuard)
export class FarmOpsController {
  constructor(private readonly domain: DomainService) {}

  /** All records of a farm for the PDF export (farm owner or admin only). */
  @Get("records-export")
  recordsExport(
    @CurrentUser() user: AuthUser,
    @Query() query: { farmId?: string; batchId?: string; from?: string; to?: string; types?: string }
  ) {
    return this.domain.exportFarmRecords(user, query);
  }

  /** Owned farms with nested flocks for hub selectors */
  @Get("context")
  context(@CurrentUser() user: AuthUser) {
    return this.domain.getFarmOpsContext(user);
  }

  /** Day summary for selected farm + flock + date */
  @Get("summary")
  summary(
    @CurrentUser() user: AuthUser,
    @Query("farmId") farmId?: string,
    @Query("batchId") batchId?: string,
    @Query("date") date?: string,
    @Query("includeRecords") includeRecords?: string
  ) {
    return this.domain.getFarmOpsDaySummary(user, {
      farmId,
      batchId,
      date,
      includeRecords
    });
  }

  @Get("batches/:id")
  getBatch(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.domain.getBatch(user, id);
  }

  @Patch("batches/:id")
  updateBatch(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.updateBatch(user, id, body);
  }

  @Patch("farms/:id")
  updateFarm(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.domain.updateFarm(user, id, body);
  }
}
