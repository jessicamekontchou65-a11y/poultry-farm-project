/**
 * Detects the real type of an uploaded file from its first bytes. The browser's
 * declared MIME type and the file name are never trusted.
 */
export type DetectedMedia = { kind: "image" | "video"; mimeType: string; extension: string };

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf: Buffer, start: number, end: number) => buf.subarray(start, end).toString("latin1");

export function detectMedia(buf: Buffer): DetectedMedia | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { kind: "image", mimeType: "image/jpeg", extension: "jpg" };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "image", mimeType: "image/png", extension: "png" };
  if (ascii(buf, 0, 6) === "GIF87a" || ascii(buf, 0, 6) === "GIF89a") return { kind: "image", mimeType: "image/gif", extension: "gif" };
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return { kind: "image", mimeType: "image/webp", extension: "webp" };

  // ISO base media (MP4, MOV, phone recordings): "ftyp" at byte 4, brand after it.
  if (ascii(buf, 4, 8) === "ftyp") {
    const brand = ascii(buf, 8, 12);
    if (brand === "qt  ") return { kind: "video", mimeType: "video/quicktime", extension: "mov" };
    // HEIC/AVIF photos also use ftyp; browsers cannot show HEIC, so refuse those brands.
    if (/^(heic|heix|hevc|mif1|msf1|avif)$/.test(brand)) return null;
    return { kind: "video", mimeType: "video/mp4", extension: "mp4" };
  }
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: "video", mimeType: "video/webm", extension: "webm" };
  return null;
}
