import { CarModel, CarEntity, CarPhotoMetadata } from "@/model/car";
import { Customer } from "@/generated/types";
import { RentalPeriod } from "@/domain/rental/rentalPeriod";

// Repository: the only place that speaks Mongoose for cars. Callers work with domain Car entities.

export const findByCarId = (carId: string): Promise<CarEntity | null> =>
  CarModel.findOne({ carId }).exec();

export const setPhoto = (
  carId: string,
  photoMetadata: CarPhotoMetadata
): Promise<CarEntity | null> =>
  CarModel.findOneAndUpdate(
    { carId },
    { $set: { photoMetadata } },
    { new: true }
  ).exec();

export const clearPhoto = (carId: string): Promise<CarEntity | null> =>
  CarModel.findOneAndUpdate(
    { carId },
    { $unset: { photoMetadata: "" } },
    { new: true }
  ).exec();

// Rent a car: persist the rental period (via leasedDate/returnDate) and the owning customer.
export const setRentalPeriod = (
  carId: string,
  rentalPeriod: RentalPeriod,
  customer: Customer
): Promise<CarEntity | null> =>
  CarModel.findOneAndUpdate(
    { carId },
    {
      $set: {
        leasedDate: rentalPeriod.leaseDate,
        returnDate: rentalPeriod.dueBackDate,
        customer,
      },
    },
    { new: true }
  ).exec();

// Return a car: clear the rental period + owner, but only if this customer currently holds it
// (the filter matches on the owner). Returns null when the customer does not hold the car.
export const clearRentalPeriod = (
  carId: string,
  customer: Customer
): Promise<CarEntity | null> =>
  CarModel.findOneAndUpdate(
    { carId, customer },
    { $unset: { leasedDate: "", returnDate: "", customer: "" } },
    { new: true }
  ).exec();
