import "reflect-metadata";
import compression from "compression";
import { json, urlencoded, type Request } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(
    json({
      limit: "4mb",
      // Keep the exact bytes so payment callbacks can be signature-checked.
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      }
    })
  );
  app.use(urlencoded({ extended: true, limit: "4mb" }));

  const config = app.get(ConfigService);
  const configuredOrigins = config
    .get<string>("APP_URL", "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  const allowedOrigins = new Set([...configuredOrigins, ...localOrigins]);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void
    ) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  });
  app.use(helmet());
  app.use(
    ["/api/auth/login", "/api/auth/register"],
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false })
  );
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const port = config.get<number>("PORT", 5000);
  await app.listen(port);
}

void bootstrap();
