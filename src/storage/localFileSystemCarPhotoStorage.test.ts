import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createLocalFileSystemCarPhotoStorage } from "./localFileSystemCarPhotoStorage";
import { CarPhotoStorage } from "./carPhotoStorage";

const storageDir = path.join(os.tmpdir(), "car-photo-storage-test");
const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02]);
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0a, 0x0b]);

let storage: CarPhotoStorage;

beforeEach(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
  storage = createLocalFileSystemCarPhotoStorage(storageDir);
});

afterAll(async () => {
  await fs.rm(storageDir, { recursive: true, force: true });
});

describe("local filesystem car photo storage", () => {
  it("round-trips bytes and content type", async () => {
    await storage.save("car-1", jpegBytes, "image/jpeg");

    const loaded = await storage.load("car-1");

    expect(loaded?.contentType).toBe("image/jpeg");
    expect(loaded?.bytes.equals(jpegBytes)).toBe(true);
  });

  it("returns null when the car has no stored photo", async () => {
    expect(await storage.load("missing")).toBeNull();
  });

  it("overwrites the previous photo when saving again (replace)", async () => {
    await storage.save("car-1", jpegBytes, "image/jpeg");
    await storage.save("car-1", pngBytes, "image/png");

    const loaded = await storage.load("car-1");
    expect(loaded?.contentType).toBe("image/png");
    expect(loaded?.bytes.equals(pngBytes)).toBe(true);

    const files = await fs.readdir(storageDir);
    expect(files.filter((name) => name.startsWith("car-1."))).toHaveLength(1);
  });

  it("deletes a stored photo", async () => {
    await storage.save("car-1", jpegBytes, "image/jpeg");

    await storage.delete("car-1");

    expect(await storage.load("car-1")).toBeNull();
  });

  it("is a no-op when deleting a photo that does not exist", async () => {
    await expect(storage.delete("missing")).resolves.toBeUndefined();
  });
});
