import {
  detectPhotoFormat,
  extensionForContentType,
  contentTypeForExtension,
} from "./photoFormat";

// Minimal byte sequences carrying each format's signature.
const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// "RIFF" (52 49 46 46) + 4 size bytes + "WEBP" (57 45 42 50)
const webpBytes = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("photo format detection", () => {
  it("detects JPEG, PNG and WebP from their signatures", () => {
    expect(detectPhotoFormat(jpegBytes)).toBe("image/jpeg");
    expect(detectPhotoFormat(pngBytes)).toBe("image/png");
    expect(detectPhotoFormat(webpBytes)).toBe("image/webp");
  });

  it("returns null for bytes that are not a supported image", () => {
    expect(detectPhotoFormat(Buffer.from("not an image at all"))).toBeNull();
    expect(detectPhotoFormat(Buffer.from([0x25, 0x50, 0x44, 0x46]))).toBeNull(); // %PDF
  });

  it("maps content types to file extensions and back", () => {
    expect(extensionForContentType("image/jpeg")).toBe("jpg");
    expect(extensionForContentType("image/png")).toBe("png");
    expect(extensionForContentType("image/webp")).toBe("webp");
    expect(contentTypeForExtension("jpg")).toBe("image/jpeg");
    expect(contentTypeForExtension("png")).toBe("image/png");
    expect(contentTypeForExtension("webp")).toBe("image/webp");
  });

  it("returns null for an unknown content type or extension", () => {
    expect(extensionForContentType("application/pdf")).toBeNull();
    expect(contentTypeForExtension("pdf")).toBeNull();
  });
});
