import { AUTH_BASE_URL, PHOTO_PATH } from "@/config/config";
import { CarPhoto } from "@/generated/types";
import { CarEntity } from "@/model/car";

// Field resolver for Car.photo. Projects the stored photo metadata into the public { url, contentType }
// the client sees; the url points at the public serving route. Null when the car has no photo.
export const fetchPhotoByCar = (car: CarEntity): CarPhoto | null => {
  if (!car.photoMetadata?.contentType) {
    return null;
  }
  return {
    url: `${AUTH_BASE_URL}${PHOTO_PATH}/${car.carId}`,
    contentType: car.photoMetadata.contentType,
  };
};
