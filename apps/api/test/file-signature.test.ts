import assert from "node:assert/strict";
import test from "node:test";
import { detectMedia } from "../src/media/file-signature";

const bytes = (...parts: (number[] | string)[]) =>
  Buffer.concat(parts.map((p) => (typeof p === "string" ? Buffer.from(p, "latin1") : Buffer.from(p))));

test("recognises common photo formats from their bytes", () => {
  assert.equal(detectMedia(bytes([0xff, 0xd8, 0xff, 0xe0]))?.mimeType, "image/jpeg");
  assert.equal(detectMedia(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mimeType, "image/png");
  assert.equal(detectMedia(bytes("GIF89a"))?.mimeType, "image/gif");
  assert.equal(detectMedia(bytes("RIFF", [0, 0, 0, 0], "WEBP"))?.mimeType, "image/webp");
});

test("recognises phone and web videos", () => {
  assert.deepEqual(detectMedia(bytes([0, 0, 0, 0x18], "ftypisom")), { kind: "video", mimeType: "video/mp4", extension: "mp4" });
  assert.equal(detectMedia(bytes([0, 0, 0, 0x14], "ftypqt  "))?.mimeType, "video/quicktime");
  assert.equal(detectMedia(bytes([0x1a, 0x45, 0xdf, 0xa3]))?.mimeType, "video/webm");
});

test("rejects disguised or unsupported files", () => {
  assert.equal(detectMedia(bytes("<html><script>alert(1)</script>")), null);
  assert.equal(detectMedia(bytes("%PDF-1.7")), null);
  assert.equal(detectMedia(bytes([0, 0, 0, 0x18], "ftypheic")), null); // HEIC photos browsers cannot show
  assert.equal(detectMedia(Buffer.alloc(0)), null);
});
