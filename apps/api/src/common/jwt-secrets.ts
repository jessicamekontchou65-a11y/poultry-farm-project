import { ConfigService } from "@nestjs/config";

type JwtSecretKey = "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET";

/**
 * Returns a JWT signing secret, refusing to fall back to a known default.
 * Placeholder values from .env.example are rejected in production.
 */
export function getJwtSecret(config: ConfigService, key: JwtSecretKey): string {
  const secret = config.get<string>(key)?.trim();
  if (!secret) {
    throw new Error(`${key} must be set (see .env.example)`);
  }
  if (process.env.NODE_ENV === "production" && (secret.startsWith("change_me") || secret.length < 32)) {
    throw new Error(`${key} must be a strong random value (32+ chars) in production`);
  }
  return secret;
}
