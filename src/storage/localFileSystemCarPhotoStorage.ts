import { promises as fs } from "fs";
import path from "path";
import { CarPhotoStorage, StoredPhoto } from "./carPhotoStorage";
import {
  extensionForContentType,
  contentTypeForExtension,
} from "@/domain/car/photoFormat";

// Local filesystem adapter — stores each car's photo as `<dir>/<carId>.<ext>`. Used for local
// development and stakeholder demos; no external infrastructure required.

const fileNamePrefix = (carId: string): string => `${carId}.`;

const findStoredFileName = async (
  baseDir: string,
  carId: string
): Promise<string | null> => {
  const entries = await readDirOrEmpty(baseDir);
  return (
    entries.find((name) => name.startsWith(fileNamePrefix(carId))) ?? null
  );
};

const readDirOrEmpty = async (baseDir: string): Promise<string[]> => {
  try {
    return await fs.readdir(baseDir);
  } catch {
    return [];
  }
};

const removeExistingPhoto = async (
  baseDir: string,
  carId: string
): Promise<void> => {
  const existing = await findStoredFileName(baseDir, carId);
  if (existing) {
    await fs.rm(path.join(baseDir, existing), { force: true });
  }
};

export const createLocalFileSystemCarPhotoStorage = (
  baseDir: string
): CarPhotoStorage => ({
  async save(carId, bytes, contentType): Promise<void> {
    const extension = extensionForContentType(contentType);
    if (!extension) {
      throw new Error(`Unsupported photo content type: ${contentType}`);
    }
    await fs.mkdir(baseDir, { recursive: true });
    await removeExistingPhoto(baseDir, carId);
    await fs.writeFile(path.join(baseDir, `${carId}.${extension}`), bytes);
  },

  async load(carId): Promise<StoredPhoto | null> {
    const fileName = await findStoredFileName(baseDir, carId);
    if (!fileName) {
      return null;
    }
    const extension = path.extname(fileName).slice(1);
    const contentType = contentTypeForExtension(extension);
    if (!contentType) {
      return null;
    }
    const bytes = await fs.readFile(path.join(baseDir, fileName));
    return { bytes, contentType };
  },

  async delete(carId): Promise<void> {
    await removeExistingPhoto(baseDir, carId);
  },
});
