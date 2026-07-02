import { RentalPeriod } from "@/generated/types";
import { CarEntity } from "@/model/car";
import { rentalPeriodFromDates } from "@/domain/rental/rentalPeriod";

// Field resolver for Car.rentalPeriod. Projects the car's persisted lease/return dates into the
// { leaseDate, dueBackDate } the client sees; null when the car is not rented.
export const fetchRentalPeriodByCar = (car: CarEntity): RentalPeriod | null =>
  rentalPeriodFromDates(car.leasedDate, car.returnDate);
