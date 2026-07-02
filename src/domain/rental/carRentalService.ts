import { Customer } from "@/generated/types";
import * as carRepository from "@/repository/carRepository";
import * as customerRepository from "@/repository/customerRepository";
import { createRentalPeriod } from "./rentalPeriod";

// Domain service for the rental relationship. Coordinates the Car and Customer aggregates through
// their repositories and enforces the renting/returning invariants — so resolvers stay thin.

const carNotFound = (carId: string): Error =>
  new Error(`Car id ${carId} does not exist`);

const customerNotFound = (customerId: string): Error =>
  new Error(`Customer id ${customerId} does not exist`);

export const rentCarToCustomer = async (
  carId: string,
  customerId: string,
  dueBackDate: Date
): Promise<Customer> => {
  const car = await carRepository.findByCarId(carId);
  if (!car) {
    throw carNotFound(carId);
  }

  const customer = await customerRepository.findByCustomerId(customerId);
  if (!customer) {
    throw customerNotFound(customerId);
  }

  if (car.customer) {
    throw new Error(`Car id ${carId} is already leased out`);
  }

  // leaseDate = now; createRentalPeriod rejects a due-back date that is not in the future.
  const rentalPeriod = createRentalPeriod(new Date(), dueBackDate);
  await carRepository.setRentalPeriod(carId, rentalPeriod, customer);

  return customer;
};

export const returnCarFromCustomer = async (
  carId: string,
  customerId: string
): Promise<Customer> => {
  const car = await carRepository.findByCarId(carId);
  if (!car) {
    throw carNotFound(carId);
  }

  const customer = await customerRepository.findByCustomerId(customerId);
  if (!customer) {
    throw customerNotFound(customerId);
  }

  // clearRentalPeriod matches on the owner, so a null result means this customer does not hold the car.
  const freedCar = await carRepository.clearRentalPeriod(carId, customer);
  if (!freedCar) {
    throw new Error(`Car id ${carId} is not rented by customer id ${customerId}`);
  }

  return customer;
};
