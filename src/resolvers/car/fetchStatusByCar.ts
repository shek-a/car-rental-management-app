import { FleetStatus } from "@/generated/types";
import { CarEntity } from "@/model/car";
import { rentalPeriodFromDates } from "@/domain/rental/rentalPeriod";
import { deriveFleetStatus } from "@/domain/rental/fleetStatus";

// Field resolver for Car.status. Derives the fleet status from the car's rental period and the
// current time — never a stored value, so it is always current.
export const fetchStatusByCar = (car: CarEntity): FleetStatus => {
  const rentalPeriod = rentalPeriodFromDates(car.leasedDate, car.returnDate);
  return deriveFleetStatus(rentalPeriod, new Date());
};
