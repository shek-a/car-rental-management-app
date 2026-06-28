import { MutationAddCarPhotoArgs } from "@/generated/types";
import { CarEntity } from "@/model/car";
import { AuthContext, requireAdministrator } from "@/auth/authorization";
import { addCarPhoto as addPhotoToCar } from "@/domain/car/carPhotoService";

export const addCarPhoto = async (
  _: unknown,
  { carId, input }: MutationAddCarPhotoArgs,
  context: AuthContext
): Promise<CarEntity> => {
  // Managing a car's photo is fleet management — administrators only (FR-002).
  requireAdministrator(context);
  return addPhotoToCar(carId, input.data);
};
