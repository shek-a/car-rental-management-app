import {
  findByCarId,
  findByLocation,
  setPhoto,
  clearPhoto,
  setRentalPeriod,
  clearRentalPeriod,
} from "./carRepository";
import { CarModel, CarPhotoMetadata } from "@/model/car";
import { createNewCar, createNewCustomer } from "@/testing/utilities";
import { createRentalPeriod } from "@/domain/rental/rentalPeriod";
import { createLocation } from "@/domain/car/location";

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

  it("finds the cars at a location, matching case-insensitively via collation", async () => {
    const carsAtLocation = [createNewCar("1", undefined, "Melbourne")];
    const collation = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(carsAtLocation) });
    // The chained query (find → collation → exec) is stubbed at the Mongoose boundary; the
    // filter and collation arguments are captured below.
    const find = jest
      .spyOn(CarModel, "find")
      .mockReturnValue({ collation } as unknown as ReturnType<typeof CarModel.find>);

    const result = await findByLocation(createLocation(" melbourne "));

    expect(result).toEqual(carsAtLocation);
    expect(find).toHaveBeenCalledWith({ location: "melbourne" });
    expect(collation).toHaveBeenCalledWith({ locale: "en", strength: 2 });
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

  it("sets a car's rental period and owner, returning the updated car", async () => {
    const updated = createNewCar("1");
    const customer = createNewCustomer("1");
    const rentalPeriod = createRentalPeriod(
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-06T00:00:00.000Z")
    );
    const findOneAndUpdate = jest
      .spyOn(CarModel, "findOneAndUpdate")
      .mockReturnValue(queryResolving(updated) as ReturnType<
        typeof CarModel.findOneAndUpdate
      >);

    const result = await setRentalPeriod("1", rentalPeriod, customer);

    expect(result).toEqual(updated);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { carId: "1" },
      {
        $set: {
          leasedDate: rentalPeriod.leaseDate,
          returnDate: rentalPeriod.dueBackDate,
          customer,
        },
      },
      { new: true }
    );
  });

  it("clears the rental period only for the car's current owner, returning the updated car (or null)", async () => {
    const updated = createNewCar("1");
    const customer = createNewCustomer("1");
    const findOneAndUpdate = jest
      .spyOn(CarModel, "findOneAndUpdate")
      .mockReturnValue(queryResolving(updated) as ReturnType<
        typeof CarModel.findOneAndUpdate
      >);

    const result = await clearRentalPeriod("1", customer);

    expect(result).toEqual(updated);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { carId: "1", customer },
      { $unset: { leasedDate: "", returnDate: "", customer: "" } },
      { new: true }
    );
  });
});
