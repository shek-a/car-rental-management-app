// Single source of truth for the supported car-photo image formats: their content types, file
// extensions, and how to recognise each from its leading bytes. Adding a new format means adding one
// entry here — nothing else changes.

export type PhotoContentType = "image/jpeg" | "image/png" | "image/webp";

interface PhotoFormat {
  contentType: PhotoContentType;
  extension: string;
  /** Returns true when the bytes begin with this format's signature. */
  matches(bytes: Buffer): boolean;
}

const startsWith = (bytes: Buffer, signature: number[]): boolean =>
  signature.every((byte, index) => bytes[index] === byte);

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const RIFF_TAG = "RIFF";
const WEBP_TAG = "WEBP";

const isWebp = (bytes: Buffer): boolean =>
  bytes.length >= 12 &&
  bytes.toString("ascii", 0, 4) === RIFF_TAG &&
  bytes.toString("ascii", 8, 12) === WEBP_TAG;

const SUPPORTED_FORMATS: readonly PhotoFormat[] = [
  { contentType: "image/jpeg", extension: "jpg", matches: (b) => startsWith(b, JPEG_SIGNATURE) },
  { contentType: "image/png", extension: "png", matches: (b) => startsWith(b, PNG_SIGNATURE) },
  { contentType: "image/webp", extension: "webp", matches: isWebp },
];

export const detectPhotoFormat = (bytes: Buffer): PhotoContentType | null =>
  SUPPORTED_FORMATS.find((format) => format.matches(bytes))?.contentType ?? null;

export const extensionForContentType = (contentType: string): string | null =>
  SUPPORTED_FORMATS.find((format) => format.contentType === contentType)?.extension ?? null;

export const contentTypeForExtension = (extension: string): PhotoContentType | null =>
  SUPPORTED_FORMATS.find((format) => format.extension === extension)?.contentType ?? null;
