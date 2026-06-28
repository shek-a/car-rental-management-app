import { MutationRemoveCarPhotoArgs } from "@/generated/types";
import { CarEntity } from "@/model/car";
import { AuthContext, requireAdministrator } from "@/auth/authorization";
import { removeCarPhoto as removePhotoFromCar } from "@/domain/car/carPhotoService";

export const removeCarPhoto = async (
  _: unknown,
  { carId }: MutationRemoveCarPhotoArgs,
  context: AuthContext
): Promise<CarEntity> => {
  // Managing a car's photo is fleet management — administrators only (FR-002).
  requireAdministrator(context);
  return removePhotoFromCar(carId);
};
