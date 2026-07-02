import { fetchRentalPeriodByCar } from "./fetchRentalPeriodByCar";
import { createNewCar, createRentedCar, createNewCustomer } from "@/testing/utilities";

const customer = createNewCustomer("1");
const leaseDate = new Date("2026-07-01T09:00:00.000Z");
const dueBackDate = new Date("2026-07-06T09:00:00.000Z");

describe("projecting a car's rental period", () => {
  it("returns the lease and due-back dates when the car is rented", () => {
    const car = createRentedCar("1", customer, leaseDate, dueBackDate);

    expect(fetchRentalPeriodByCar(car)).toEqual({ leaseDate, dueBackDate });
  });

  it("returns null when the car has no rental period", () => {
    expect(fetchRentalPeriodByCar(createNewCar("1"))).toBeNull();
  });
});
