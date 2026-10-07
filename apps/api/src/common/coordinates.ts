import { BadRequestException } from "@nestjs/common";

export type Coordinates = { latitude: number; longitude: number };

/**
 * Validates a {latitude, longitude} pair sent by a client. Returns undefined when nothing
 * was sent, null when the client clears the position, and throws on invalid values.
 */
export function parseCoordinates(value: unknown): Coordinates | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "object") throw new BadRequestException("Coordinates must be an object");

  const { latitude, longitude } = value as Record<string, unknown>;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new BadRequestException("Latitude must be between -90 and 90");
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new BadRequestException("Longitude must be between -180 and 180");
  // About 1 m precision is plenty and keeps stored values tidy.
  return { latitude: Math.round(lat * 1e5) / 1e5, longitude: Math.round(lng * 1e5) / 1e5 };
}
