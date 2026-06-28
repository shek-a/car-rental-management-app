import { addCarPhoto, removeCarPhoto } from "./carPhotoService";
import * as carRepository from "@/repository/carRepository";
import { carPhotoStorage } from "@/storage/carPhotoStorageProvider";
import { createNewCar } from "@/testing/utilities";

jest.mock("@/repository/carRepository");
jest.mock("@/storage/carPhotoStorageProvider");

const repo = carRepository as jest.Mocked<typeof carRepository>;
const storage = { save: jest.fn(), load: jest.fn(), delete: jest.fn() };
(carPhotoStorage as jest.Mock).mockReturnValue(storage);

const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
const pdfBase64 = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]).toString("base64");

describe("adding a car photo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (carPhotoStorage as jest.Mock).mockReturnValue(storage);
  });

  it("stores the bytes and records the photo metadata against the car", async () => {
    repo.findByCarId.mockResolvedValue(createNewCar("1"));
    repo.setPhoto.mockResolvedValue(createNewCar("1"));

    await addCarPhoto("1", jpegBase64);

    const [savedCarId, savedBytes, savedContentType] = storage.save.mock.calls[0];
    expect(savedCarId).toBe("1");
    expect(savedBytes[0]).toBe(0xff);
    expect(savedContentType).toBe("image/jpeg");

    const [metaCarId, metadata] = repo.setPhoto.mock.calls[0];
    expect(metaCarId).toBe("1");
    expect(metadata.contentType).toBe("image/jpeg");
    expect(metadata.storageKey).toBe("1");
    expect(metadata.addedAt).toBeInstanceOf(Date);
  });

  it("throws and stores nothing when the car does not exist", async () => {
    repo.findByCarId.mockResolvedValue(null);

    await expect(addCarPhoto("missing", jpegBase64)).rejects.toThrow(
      "Car id missing does not exist"
    );
    expect(storage.save).not.toHaveBeenCalled();
    expect(repo.setPhoto).not.toHaveBeenCalled();
  });

  it("throws and stores nothing when the image is invalid (existing photo untouched)", async () => {
    repo.findByCarId.mockResolvedValue(createNewCar("1"));

    await expect(addCarPhoto("1", pdfBase64)).rejects.toThrow("Invalid car photo");
    expect(storage.save).not.toHaveBeenCalled();
    expect(repo.setPhoto).not.toHaveBeenCalled();
  });
});

describe("removing a car photo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (carPhotoStorage as jest.Mock).mockReturnValue(storage);
  });

  it("deletes the bytes and clears the photo metadata", async () => {
    repo.findByCarId.mockResolvedValue(createNewCar("1"));
    repo.clearPhoto.mockResolvedValue(createNewCar("1"));

    await removeCarPhoto("1");

    expect(storage.delete).toHaveBeenCalledWith("1");
    expect(repo.clearPhoto).toHaveBeenCalledWith("1");
  });

  it("throws and removes nothing when the car does not exist", async () => {
    repo.findByCarId.mockResolvedValue(null);

    await expect(removeCarPhoto("missing")).rejects.toThrow(
      "Car id missing does not exist"
    );
    expect(storage.delete).not.toHaveBeenCalled();
    expect(repo.clearPhoto).not.toHaveBeenCalled();
  });
});
