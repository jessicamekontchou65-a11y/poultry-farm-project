import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { MediaModule } from "./media/media.module";
import { ResourcesModule } from "./resources/resources.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // The API may start from apps/api (npm --prefix) or the repo root; read both places.
      // Earlier files win, so a local apps/api/.env overrides the shared root one.
      envFilePath: [".env.local", ".env", "../../.env.local", "../../.env"]
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          "MONGODB_URI",
          "mongodb://localhost:27017/poultryhub"
        )
      })
    }),
    HealthModule,
    AuthModule,
    ResourcesModule,
    KnowledgeModule,
    MediaModule
  ]
})
export class AppModule {}
