import { detectPhotoFormat, PhotoContentType } from "./photoFormat";

// Validates an uploaded car photo. Returns a discriminated result so callers handle both cases
// explicitly. The format is determined from the bytes (magic-byte signature), never trusted from a
// client-declared content type.

export type CarPhotoValidationResult =
  | { kind: "valid"; bytes: Buffer; contentType: PhotoContentType }
  | { kind: "invalid"; reason: string };

const BASE64_DATA_URI = /^data:[^;]+;base64,/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

const invalid = (reason: string): CarPhotoValidationResult => ({
  kind: "invalid",
  reason,
});

const decodeBase64 = (data: string): Buffer | null => {
  const withoutPrefix = data.replace(BASE64_DATA_URI, "").trim();
  if (withoutPrefix.length === 0 || !BASE64_PATTERN.test(withoutPrefix)) {
    return null;
  }
  return Buffer.from(withoutPrefix, "base64");
};

export const validateCarPhoto = (
  data: string,
  maxBytes: number
): CarPhotoValidationResult => {
  const bytes = decodeBase64(data);
  if (!bytes || bytes.length === 0) {
    return invalid("the photo data is not valid base64");
  }

  const contentType = detectPhotoFormat(bytes);
  if (!contentType) {
    return invalid("the file is not a supported image (JPEG, PNG or WebP)");
  }

  if (bytes.length > maxBytes) {
    return invalid(`the photo exceeds the maximum size of ${maxBytes} bytes`);
  }

  return { kind: "valid", bytes, contentType };
};
