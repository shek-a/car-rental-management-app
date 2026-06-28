import mongoose from "mongoose";
import { promises as fs } from "fs";
import path from "path";
import { MONGODB_CONNECTION_URI } from "@/config/config";
import { CarModel } from "@/model/car";
import { addCarPhoto, removeCarPhoto } from "@/domain/car/carPhotoService";
import { carPhotoStorage } from "@/storage/carPhotoStorageProvider";

// Verifies the storage boundary with a REAL image: bytes flow through validation → the local
// filesystem adapter, and metadata lands in Mongo and round-trips. Business-rule edge cases are
// covered by the unit tests.

const carId = "integration-photo-car";
const imagePath = path.join(__dirname, "fixtures", "car-image.jpg");

const seedCar = (): Promise<unknown> =>
  new CarModel({
    carId,
    make: "Toyota",
    model: "Corolla",
    type: "SEDAN",
    costPerDay: 60,
  }).save();

beforeAll(async () => {
  await mongoose.connect(MONGODB_CONNECTION_URI);
});

afterAll(async () => {
  await carPhotoStorage().delete(carId);
  await CarModel.deleteMany({ carId });
  await mongoose.disconnect();
});

beforeEach(async () => {
  await CarModel.deleteMany({ carId });
  await carPhotoStorage().delete(carId);
});

describe("car photo storage (integration)", () => {
  it("stores a real uploaded JPEG and serves back the identical bytes", async () => {
    await seedCar();
    const imageBytes = await fs.readFile(imagePath);

    await addCarPhoto(carId, imageBytes.toString("base64"));

    const storedCar = await CarModel.findOne({ carId });
    expect(storedCar?.photoMetadata?.contentType).toBe("image/jpeg");
    expect(storedCar?.photoMetadata?.storageKey).toBe(carId);

    const loaded = await carPhotoStorage().load(carId);
    expect(loaded?.contentType).toBe("image/jpeg");
    expect(loaded?.bytes.equals(imageBytes)).toBe(true);
  });

  it("removes the image bytes and clears the metadata", async () => {
    await seedCar();
    const imageBytes = await fs.readFile(imagePath);
    await addCarPhoto(carId, imageBytes.toString("base64"));

    await removeCarPhoto(carId);

    const storedCar = await CarModel.findOne({ carId });
    expect(storedCar?.photoMetadata).toBeFalsy();
    expect(await carPhotoStorage().load(carId)).toBeNull();
  });
});
