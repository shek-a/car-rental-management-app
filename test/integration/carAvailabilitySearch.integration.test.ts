import mongoose from "mongoose";
import { MONGODB_CONNECTION_URI } from "@/config/config";
import { CarModel } from "@/model/car";
import { findByLocation } from "@/repository/carRepository";
import { createLocation } from "@/domain/car/location";
import { searchAvailableCars } from "@/resolvers/queries/car/searchAvailableCars";
import { cars } from "@/resolvers/queries/car/cars";
import { fetchStatusByCar } from "@/resolvers/car/fetchStatusByCar";
import { fetchPhotoByCar } from "@/resolvers/car/fetchPhotoByCar";
import { FleetStatus } from "@/generated/types";

// Verifies the search boundary: the collation-based location match works against real Mongo and
// the query is wired end-to-end (resolver → service → repository → Mongo). Availability edge
// cases are covered by the unit tests.

const carIdPrefix = "search-int-";
const carId = (name: string): string => `${carIdPrefix}${name}`;
// Unique per-suite location names so fixtures from other suites (or manual runs) sharing the
// database can never satisfy this suite's location match.
const melbourne = "Search-Int-Melbourne";
const sydney = "Search-Int-Sydney";
const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const baseCar = (name: string) => ({
  carId: carId(name),
  make: "Toyota",
  model: "Corolla",
  type: "SEDAN",
  costPerDay: 60,
});

beforeAll(async () => {
  await mongoose.connect(MONGODB_CONNECTION_URI);
});

afterAll(async () => {
  await CarModel.deleteMany({ carId: { $regex: `^${carIdPrefix}` } });
  await mongoose.disconnect();
});

beforeEach(async () => {
  await CarModel.deleteMany({ carId: { $regex: `^${carIdPrefix}` } });
  await CarModel.insertMany([
    { ...baseCar("free"), location: melbourne },
    {
      ...baseCar("rented"),
      location: melbourne,
      leasedDate: daysFromNow(-2),
      returnDate: daysFromNow(11),
    },
    {
      ...baseCar("overdue"),
      location: melbourne,
      leasedDate: daysFromNow(-30),
      returnDate: daysFromNow(-10),
    },
    { ...baseCar("sydney"), location: sydney },
    baseCar("no-location"),
  ]);
});

describe("car availability search (integration)", () => {
  it("matches a location case-insensitively and ignores cars without one", async () => {
    const found = await findByLocation(createLocation(" search-int-melbourne "));

    const foundIds = found.map((car) => car.carId).sort();
    expect(foundIds).toEqual([carId("free"), carId("overdue"), carId("rented")]);
  });

  it("still returns cars without a location in the plain catalogue listing", async () => {
    const catalogue = await cars();

    expect(catalogue.map((car) => car.carId)).toContain(carId("no-location"));
  });

  it("searches end-to-end and returns cars in the catalogue shape", async () => {
    const results = await searchAvailableCars(
      {},
      {
        location: melbourne,
        requestedPeriod: {
          leaseDate: daysFromNow(6).toISOString(),
          dueBackDate: daysFromNow(9).toISOString(),
        },
      }
    );

    // Only the free car: the rented car's period overlaps, the overdue car is never offered.
    expect(results.map((car) => car.carId)).toEqual([carId("free")]);

    const [availableCar] = results;
    expect(availableCar.make).toBe("Toyota");
    expect(availableCar.location).toBe(melbourne);
    expect(fetchStatusByCar(availableCar)).toBe(FleetStatus.Available);
    expect(fetchPhotoByCar(availableCar)).toBeNull();
  });
});
