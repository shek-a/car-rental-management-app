import mongoose from "mongoose";
import { MONGODB_CONNECTION_URI } from "@/config/config";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import {
  rentCarToCustomer,
  returnCarFromCustomer,
} from "@/domain/rental/carRentalService";
import { findByCarId } from "@/repository/carRepository";
import { fetchStatusByCar } from "@/resolvers/car/fetchStatusByCar";
import { CustomerRole, FleetStatus } from "@/generated/types";

// Verifies the persistence boundary: detail fields round-trip, and renting/returning writes and
// clears the rental period so the derived status is correct end-to-end. Business edge cases are
// covered by the unit tests.

const carId = "integration-rental-car";
const customerId = "integration-rental-customer";
const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

beforeAll(async () => {
  await mongoose.connect(MONGODB_CONNECTION_URI);
});

afterAll(async () => {
  await CarModel.deleteMany({ carId });
  await CustomerModel.deleteMany({ customerId });
  await mongoose.disconnect();
});

beforeEach(async () => {
  await CarModel.deleteMany({ carId });
  await CustomerModel.deleteMany({ customerId });
  await new CarModel({
    carId,
    make: "Tesla",
    model: "Model 3",
    type: "SEDAN",
    costPerDay: 90,
    plate: "ROVE-9",
    year: 2025,
    seats: 5,
    transmission: "Automatic",
    fuel: "Electric",
    colour: "Red",
  }).save();
  await new CustomerModel({
    customerId,
    email: "renter@example.com",
    role: CustomerRole.Customer,
  }).save();
});

describe("rental lifecycle (integration)", () => {
  it("persists the car detail fields", async () => {
    const car = await findByCarId(carId);

    expect(car?.plate).toBe("ROVE-9");
    expect(car?.year).toBe(2025);
    expect(car?.fuel).toBe("Electric");
  });

  it("rents a car for a period (LEASED) and returns it to AVAILABLE", async () => {
    await rentCarToCustomer(carId, customerId, daysFromNow(5));

    const rented = await findByCarId(carId);
    expect(rented?.leasedDate).toBeTruthy();
    expect(rented?.returnDate).toBeTruthy();
    expect(fetchStatusByCar(rented!)).toBe(FleetStatus.Leased);

    await returnCarFromCustomer(carId, customerId);

    const returned = await findByCarId(carId);
    expect(returned?.leasedDate ?? null).toBeNull();
    expect(returned?.customer ?? null).toBeNull();
    expect(fetchStatusByCar(returned!)).toBe(FleetStatus.Available);
  });

  it("derives OVERDUE once the due-back date has passed", async () => {
    await rentCarToCustomer(carId, customerId, daysFromNow(5));
    await CarModel.findOneAndUpdate(
      { carId },
      { $set: { returnDate: daysFromNow(-1) } }
    );

    const car = await findByCarId(carId);
    expect(fetchStatusByCar(car!)).toBe(FleetStatus.Overdue);
  });
});
