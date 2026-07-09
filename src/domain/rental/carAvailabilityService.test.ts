import { searchAvailableCars } from "./carAvailabilityService";
import * as carRepository from "@/repository/carRepository";
import { createLocation } from "@/domain/car/location";
import { createRentalPeriod } from "./rentalPeriod";
import { createNewCar, createNewCustomer, createRentedCar } from "@/testing/utilities";

jest.mock("@/repository/carRepository");

const carRepo = carRepository as jest.Mocked<typeof carRepository>;

// A fixed "now" keeps the overdue rule deterministic: rentals due back before this instant are
// overdue; later ones are current.
const now = new Date("2026-07-09T12:00:00.000Z");
const melbourne = createLocation("Melbourne");
const requestedPeriod = createRentalPeriod(
  new Date("2026-07-15T00:00:00.000Z"),
  new Date("2026-07-18T00:00:00.000Z")
);

const customer = createNewCustomer("1");
const rentedFor = (carId: string, lease: string, dueBack: string) =>
  createRentedCar(carId, customer, new Date(lease), new Date(dueBack), "Melbourne");

describe("car availability search", () => {
  beforeEach(() => jest.resetAllMocks());

  it("asks the repository for the cars at the searched location", async () => {
    carRepo.findByLocation.mockResolvedValue([]);

    await searchAvailableCars(melbourne, requestedPeriod, now);

    const [searchedLocation] = carRepo.findByLocation.mock.calls[0];
    expect(searchedLocation.value).toBe("Melbourne");
  });

  it("returns a car with no current rental for any requested period", async () => {
    const freeCar = createNewCar("free", undefined, "Melbourne");
    carRepo.findByLocation.mockResolvedValue([freeCar]);

    const results = await searchAvailableCars(melbourne, requestedPeriod, now);

    expect(results).toEqual([freeCar]);
  });

  it("excludes a car whose rental overlaps the requested period", async () => {
    const overlapping = rentedFor("rented", "2026-07-05T00:00:00.000Z", "2026-07-16T00:00:00.000Z");
    carRepo.findByLocation.mockResolvedValue([overlapping]);

    const results = await searchAvailableCars(melbourne, requestedPeriod, now);

    expect(results).toEqual([]);
  });

  it("excludes a car due back on the requested pickup day (no same-day turnaround)", async () => {
    const dueBackOnPickupDay = rentedFor("boundary", "2026-07-05T00:00:00.000Z", "2026-07-15T09:00:00.000Z");
    carRepo.findByLocation.mockResolvedValue([dueBackOnPickupDay]);

    const results = await searchAvailableCars(melbourne, requestedPeriod, now);

    expect(results).toEqual([]);
  });

  it("returns a rented car whose rental ends before the requested period begins", async () => {
    const backBeforePickup = rentedFor("early-return", "2026-07-05T00:00:00.000Z", "2026-07-12T00:00:00.000Z");
    carRepo.findByLocation.mockResolvedValue([backBeforePickup]);

    const results = await searchAvailableCars(melbourne, requestedPeriod, now);

    expect(results).toEqual([backBeforePickup]);
  });

  it("excludes an overdue car even for a period after its due-back date", async () => {
    // Due back well before "now" but never returned — its true return date is unknown.
    const overdue = rentedFor("overdue", "2026-06-01T00:00:00.000Z", "2026-06-20T00:00:00.000Z");
    carRepo.findByLocation.mockResolvedValue([overdue]);

    const results = await searchAvailableCars(melbourne, requestedPeriod, now);

    expect(results).toEqual([]);
  });

  it("keeps only the available cars when the fleet at a location is mixed", async () => {
    const freeCar = createNewCar("free", undefined, "Melbourne");
    const overlapping = rentedFor("rented", "2026-07-05T00:00:00.000Z", "2026-07-16T00:00:00.000Z");
    const backBeforePickup = rentedFor("early-return", "2026-07-05T00:00:00.000Z", "2026-07-12T00:00:00.000Z");
    carRepo.findByLocation.mockResolvedValue([freeCar, overlapping, backBeforePickup]);

    const results = await searchAvailableCars(melbourne, requestedPeriod, now);

    expect(results).toEqual([freeCar, backBeforePickup]);
  });
});
