import { validateCarPhoto } from "./carPhotoValidation";

const MAX_BYTES = 5 * 1024 * 1024;

const base64Of = (bytes: number[]): string => Buffer.from(bytes).toString("base64");

const jpeg = base64Of([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = base64Of([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdf = base64Of([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

describe("car photo validation", () => {
  it("accepts a supported image and reports its detected content type", () => {
    const result = validateCarPhoto(jpeg, MAX_BYTES);

    expect(result.kind).toBe("valid");
    if (result.kind === "valid") {
      expect(result.contentType).toBe("image/jpeg");
      expect(result.bytes[0]).toBe(0xff);
    }
  });

  it("detects the format from the bytes, not the (untrusted) declared type", () => {
    const result = validateCarPhoto(png, MAX_BYTES);
    expect(result.kind === "valid" && result.contentType).toBe("image/png");
  });

  it("rejects a file that is not a supported image", () => {
    const result = validateCarPhoto(pdf, MAX_BYTES);
    expect(result.kind).toBe("invalid");
  });

  it("rejects an undecodable / empty payload", () => {
    expect(validateCarPhoto("", MAX_BYTES).kind).toBe("invalid");
    expect(validateCarPhoto("@@@not base64@@@", MAX_BYTES).kind).toBe("invalid");
  });

  it("rejects an image larger than the maximum size", () => {
    const result = validateCarPhoto(jpeg, 3); // 3-byte limit, the jpeg is larger
    expect(result.kind).toBe("invalid");
  });
});
