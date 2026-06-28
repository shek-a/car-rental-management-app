import { findByCarId, setPhoto, clearPhoto } from "./carRepository";
import { CarModel, CarPhotoMetadata } from "@/model/car";
import { createNewCar } from "@/testing/utilities";

// A query whose .exec() resolves to the given value. Mongoose's Query type is impractical to mock,
// so the boundary is stubbed and the filter/update arguments are captured below.
const queryResolving = (value: unknown) =>
  ({ exec: jest.fn().mockResolvedValue(value) } as unknown as ReturnType<
    typeof CarModel.findOne
  >);

const photoMetadata: CarPhotoMetadata = {
  contentType: "image/jpeg",
  storageKey: "1",
  addedAt: new Date("2026-06-28T00:00:00.000Z"),
};

describe("car repository", () => {
  afterEach(() => jest.restoreAllMocks());

  it("finds a car by car id", async () => {
    const car = createNewCar("1");
    const findOne = jest
      .spyOn(CarModel, "findOne")
      .mockReturnValue(queryResolving(car));

    const result = await findByCarId("1");

    expect(result).toEqual(car);
    expect(findOne).toHaveBeenCalledWith({ carId: "1" });
  });

  it("sets a car's photo metadata and returns the updated car", async () => {
    const updated = createNewCar("1");
    const findOneAndUpdate = jest
      .spyOn(CarModel, "findOneAndUpdate")
      .mockReturnValue(queryResolving(updated) as ReturnType<
        typeof CarModel.findOneAndUpdate
      >);

    const result = await setPhoto("1", photoMetadata);

    expect(result).toEqual(updated);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { carId: "1" },
      { $set: { photoMetadata } },
      { new: true }
    );
  });

  it("clears a car's photo metadata and returns the updated car", async () => {
    const updated = createNewCar("1");
    const findOneAndUpdate = jest
      .spyOn(CarModel, "findOneAndUpdate")
      .mockReturnValue(queryResolving(updated) as ReturnType<
        typeof CarModel.findOneAndUpdate
      >);

    const result = await clearPhoto("1");

    expect(result).toEqual(updated);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { carId: "1" },
      { $unset: { photoMetadata: "" } },
      { new: true }
    );
  });
});
