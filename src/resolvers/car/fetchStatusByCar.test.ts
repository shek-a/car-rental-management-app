import { fetchStatusByCar } from "./fetchStatusByCar";
import { createNewCar, createRentedCar, createNewCustomer } from "@/testing/utilities";
import { FleetStatus } from "@/generated/types";

const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const customer = createNewCustomer("1");

describe("deriving a car's fleet status", () => {
  it("is AVAILABLE when the car has no rental period", () => {
    expect(fetchStatusByCar(createNewCar("1"))).toBe(FleetStatus.Available);
  });

  it("is LEASED when the due-back date is well in the future", () => {
    const car = createRentedCar("1", customer, daysFromNow(-1), daysFromNow(5));
    expect(fetchStatusByCar(car)).toBe(FleetStatus.Leased);
  });

  it("is DUE_SOON when the due-back date is within 2 days", () => {
    const car = createRentedCar("1", customer, daysFromNow(-1), daysFromNow(1));
    expect(fetchStatusByCar(car)).toBe(FleetStatus.DueSoon);
  });

  it("is OVERDUE when the due-back date has passed", () => {
    const car = createRentedCar("1", customer, daysFromNow(-5), daysFromNow(-1));
    expect(fetchStatusByCar(car)).toBe(FleetStatus.Overdue);
  });
});
