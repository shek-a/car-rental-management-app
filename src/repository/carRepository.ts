import { CarModel, CarEntity, CarPhotoMetadata } from "@/model/car";

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
