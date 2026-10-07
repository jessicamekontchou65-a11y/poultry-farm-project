import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { schemaDefinitions } from "../database/schemas";
import { AdminController } from "./admin.controller";
import { MarketplaceController } from "./marketplace.controller";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";
import { SrsController } from "./srs.controller";
import { DomainService } from "./domain.service";
import { PoultryBotController } from "./poultrybot.controller";
import { PlatformController } from "./platform.controller";
import { FarmOpsController } from "./farm-ops.controller";
import { CampayController } from "../payments/campay.controller";
import { CampayService } from "../payments/campay.service";

@Module({
  imports: [JwtModule.register({}), MongooseModule.forFeature(schemaDefinitions), KnowledgeModule],
  controllers: [
    ResourcesController, 
    SrsController, 
    MarketplaceController, 
    AdminController,
    PoultryBotController,
    PlatformController,
    FarmOpsController,
    CampayController
  ],
  providers: [ResourcesService, DomainService, CampayService],
  exports: [ResourcesService]
})
export class ResourcesModule {}
