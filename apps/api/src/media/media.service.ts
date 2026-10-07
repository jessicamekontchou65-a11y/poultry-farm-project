import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { schemaNames } from "../database/schema-names";
import type { AuthUser } from "../resources/domain.service";
import { detectMedia } from "./file-signature";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
/** Roles allowed to publish photos and videos (sellers and moderators). */
export const MEDIA_UPLOAD_ROLES = ["farmer", "shopkeeper", "admin", "super_admin"];

export function mediaDirectory(config: ConfigService) {
  return path.resolve(config.get<string>("MEDIA_DIR") || path.join(process.cwd(), "uploads"));
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService
  ) {}

  async upload(user: AuthUser, file: Express.Multer.File | undefined) {
    if (!user.roles.some((role) => MEDIA_UPLOAD_ROLES.includes(role))) {
      throw new ForbiddenException("Only farmers and shopkeepers can publish photos and videos");
    }
    if (!file?.buffer?.length) throw new BadRequestException("Choose a photo or a video to upload");

    const detected = detectMedia(file.buffer);
    if (!detected) {
      throw new BadRequestException("Unsupported file. Use JPG, PNG, WebP or GIF photos, or MP4, MOV or WebM videos");
    }
    const limit = detected.kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      throw new PayloadTooLargeException(
        detected.kind === "video" ? "Videos must be 50 MB or less" : "Photos must be 8 MB or less"
      );
    }

    const stored = this.cloudinaryConfigured()
      ? await this.storeInCloudinary(file.buffer, detected.kind)
      : await this.storeLocally(file.buffer, detected.extension);

    const asset = await this.connection.model(schemaNames.MediaAsset).create({
      ownerId: user.id,
      url: stored.url,
      publicId: stored.publicId,
      storageProvider: stored.provider,
      mimeType: detected.mimeType,
      kind: detected.kind,
      sizeBytes: file.size,
      entityType: "post",
      visibility: "public"
    });

    return {
      data: { _id: asset._id, url: asset.url, kind: detected.kind, mimeType: detected.mimeType, sizeBytes: file.size }
    };
  }

  /** Uploads that belong to the user, in the requested order, for attaching to a post. */
  async resolveOwned(user: AuthUser, ids: unknown) {
    const list = (Array.isArray(ids) ? ids : []).map(String).filter((id) => Types.ObjectId.isValid(id));
    if (list.length === 0) return [];
    if (list.length > 4) throw new BadRequestException("A post can have at most 4 photos or videos");
    const assets = await this.connection
      .model(schemaNames.MediaAsset)
      .find({ _id: { $in: list }, ownerId: user.id })
      .lean();
    const byId = new Map(assets.map((asset: any) => [String(asset._id), asset]));
    const ordered = list.map((id) => byId.get(id));
    if (ordered.some((asset) => !asset)) throw new NotFoundException("One of the files was not found");
    return ordered.map((asset: any) => ({
      url: asset.url,
      kind: asset.kind ?? (String(asset.mimeType).startsWith("video/") ? "video" : "image"),
      mimeType: asset.mimeType,
      assetId: asset._id
    }));
  }

  /** Removes stored files that are no longer referenced (best effort). */
  async deleteAssets(assetIds: unknown[]) {
    const ids = assetIds.map(String).filter((id) => Types.ObjectId.isValid(id));
    if (!ids.length) return;
    const assets = await this.connection.model(schemaNames.MediaAsset).find({ _id: { $in: ids } }).lean();
    for (const asset of assets as any[]) {
      if (asset.storageProvider === "local") {
        const name = path.basename(String(asset.url));
        await unlink(path.join(mediaDirectory(this.config), name)).catch(() => undefined);
      }
    }
    await this.connection.model(schemaNames.MediaAsset).deleteMany({ _id: { $in: ids } });
  }

  private async storeLocally(buffer: Buffer, extension: string) {
    const dir = mediaDirectory(this.config);
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${extension}`;
    await writeFile(path.join(dir, name), buffer, { flag: "wx" });
    const base = (this.config.get<string>("API_URL") || `http://localhost:${this.config.get("PORT", 5000)}`).replace(/\/$/, "");
    return { url: `${base}/api/media/files/${name}`, publicId: name, provider: "local" as const };
  }

  private cloudinaryConfigured() {
    return ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every((key) =>
      this.config.get<string>(key)?.trim()
    );
  }

  /** Signed upload to Cloudinary's REST API (used when CLOUDINARY_* are set). */
  private async storeInCloudinary(buffer: Buffer, kind: "image" | "video") {
    const cloud = this.config.get<string>("CLOUDINARY_CLOUD_NAME")!.trim();
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY")!.trim();
    const secret = this.config.get<string>("CLOUDINARY_API_SECRET")!.trim();
    const folder = "poultryhub/posts";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)]));
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/${kind}/upload`, {
      method: "POST",
      body: form
    });
    const body = (await response.json().catch(() => ({}))) as { secure_url?: string; public_id?: string; error?: { message?: string } };
    if (!response.ok || !body.secure_url) {
      this.logger.warn(`Cloudinary upload failed: ${response.status} ${body.error?.message ?? ""}`);
      throw new BadGatewayException("The media storage service rejected the upload");
    }
    return { url: body.secure_url, publicId: body.public_id, provider: "cloudinary" as const };
  }
}
