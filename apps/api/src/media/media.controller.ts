import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import type { AuthUser } from "../resources/domain.service";
import { MAX_VIDEO_BYTES, MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Multipart upload with one "file" field: a photo or a video for a post. */
  @UseGuards(JwtAuthGuard)
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      // Hard ceiling; the service then applies the per-type limit after checking the bytes.
      limits: { fileSize: MAX_VIDEO_BYTES, files: 1 }
    })
  )
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    return this.media.upload(user, file);
  }
}
