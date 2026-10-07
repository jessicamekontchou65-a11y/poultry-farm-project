import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { schemaDefinitions } from "../database/schemas";
import { KnowledgeAdminController, KnowledgeController } from "./knowledge.controller";
import { KnowledgeService } from "./knowledge.service";

@Module({
  imports: [MongooseModule.forFeature(schemaDefinitions)],
  controllers: [KnowledgeController, KnowledgeAdminController],
  providers: [KnowledgeService],
  exports: [KnowledgeService]
})
export class KnowledgeModule {}
