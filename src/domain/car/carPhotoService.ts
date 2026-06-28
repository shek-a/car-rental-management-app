import { PHOTO_MAX_BYTES } from "@/config/config";
import { CarEntity } from "@/model/car";
import * as carRepository from "@/repository/carRepository";
import { carPhotoStorage } from "@/storage/carPhotoStorageProvider";
import { validateCarPhoto } from "./carPhotoValidation";

const carNotFound = (carId: string): Error =>
  new Error(`Car id ${carId} does not exist`);

// Domain service for a car's photo. Orchestrates validation, byte storage (via the port), and photo
// metadata on the Car. An invalid upload changes nothing (FR-011).

export const addCarPhoto = async (
  carId: string,
  photoData: string
): Promise<CarEntity> => {
  const car = await carRepository.findByCarId(carId);
  if (!car) {
    throw carNotFound(carId);
  }

  const validation = validateCarPhoto(photoData, PHOTO_MAX_BYTES);
  if (validation.kind === "invalid") {
    throw new Error(`Invalid car photo: ${validation.reason}`);
  }

  await carPhotoStorage().save(carId, validation.bytes, validation.contentType);

  const updatedCar = await carRepository.setPhoto(carId, {
    contentType: validation.contentType,
    storageKey: carId,
    addedAt: new Date(),
  });
  if (!updatedCar) {
    throw carNotFound(carId);
  }
  return updatedCar;
};

export const removeCarPhoto = async (carId: string): Promise<CarEntity> => {
  const car = await carRepository.findByCarId(carId);
  if (!car) {
    throw carNotFound(carId);
  }

  await carPhotoStorage().delete(carId);

  const updatedCar = await carRepository.clearPhoto(carId);
  if (!updatedCar) {
    throw carNotFound(carId);
  }
  return updatedCar;
};
