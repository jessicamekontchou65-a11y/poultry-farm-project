import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { schemaDefinitions } from "../database/schemas";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

@Module({
  imports: [MongooseModule.forFeature(schemaDefinitions)],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService]
})
export class MediaModule {}
