import { fetchPhotoByCar } from "./fetchPhotoByCar";
import { createNewCar } from "@/testing/utilities";
import { CarEntity } from "@/model/car";
import { AUTH_BASE_URL, PHOTO_PATH } from "@/config/config";

describe("resolving a car's photo", () => {
  it("returns the public url and content type when the car has a photo", () => {
    const car: CarEntity = {
      ...createNewCar("car-1"),
      photoMetadata: {
        contentType: "image/png",
        storageKey: "car-1",
        addedAt: new Date("2026-06-28T00:00:00.000Z"),
      },
    };

    const photo = fetchPhotoByCar(car);

    expect(photo).toEqual({
      url: `${AUTH_BASE_URL}${PHOTO_PATH}/car-1`,
      contentType: "image/png",
    });
  });

  it("returns null when the car has no photo", () => {
    expect(fetchPhotoByCar(createNewCar("car-1"))).toBeNull();
  });
});
