import { FleetStatus } from "@/generated/types";
import { CarEntity } from "@/model/car";
import { Location } from "@/domain/car/location";
import * as carRepository from "@/repository/carRepository";
import {
  RentalPeriod,
  periodsOverlap,
  rentalPeriodFromDates,
} from "./rentalPeriod";
import { deriveFleetStatus } from "./fleetStatus";

// CarAvailabilityService — a stateless domain service: availability spans many Car entities plus
// the searcher's requested period, so it belongs to no single entity. Availability is derived at
// read time, never stored.

// A car is available for a requested period when it has no current rental, or its rental neither
// overlaps the request nor is overdue. An overdue car is still out with no known return date, so
// no future period can be promised for it.
export const isAvailableForPeriod = (
  rentalPeriod: RentalPeriod | null,
  requestedPeriod: RentalPeriod,
  now: Date
): boolean => {
  if (!rentalPeriod) {
    return true;
  }
  if (deriveFleetStatus(rentalPeriod, now) === FleetStatus.Overdue) {
    return false;
  }
  return !periodsOverlap(rentalPeriod, requestedPeriod);
};

export const searchAvailableCars = async (
  location: Location,
  requestedPeriod: RentalPeriod,
  now: Date
): Promise<CarEntity[]> => {
  const carsAtLocation = await carRepository.findByLocation(location);
  return carsAtLocation.filter((car) =>
    isAvailableForPeriod(
      rentalPeriodFromDates(car.leasedDate, car.returnDate),
      requestedPeriod,
      now
    )
  );
};
