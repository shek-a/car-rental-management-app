import { QuerySearchAvailableCarsArgs } from "@/generated/types";
import { CarEntity } from "@/model/car";
import { createLocation } from "@/domain/car/location";
import { createRentalPeriod } from "@/domain/rental/rentalPeriod";
import * as carAvailabilityService from "@/domain/rental/carAvailabilityService";

// Public catalogue search — no auth guard, like `cars`/`car`. The resolver only translates: it
// builds the domain value objects from the raw args (the Date scalar is a passthrough, so period
// values arrive as strings) and delegates to the availability domain service. Derived fields
// (status, rentalPeriod, photo, customer) are supplied by the registered Car field resolvers.
// Declared async so validation failures reject the returned promise rather than throwing
// synchronously at call time.
export const searchAvailableCars = async (
  _: unknown,
  { location, requestedPeriod }: QuerySearchAvailableCarsArgs
): Promise<CarEntity[]> => {
  const searchedLocation = createLocation(location);
  const period = createRentalPeriod(
    new Date(requestedPeriod.leaseDate),
    new Date(requestedPeriod.dueBackDate)
  );
  return carAvailabilityService.searchAvailableCars(
    searchedLocation,
    period,
    new Date()
  );
};
