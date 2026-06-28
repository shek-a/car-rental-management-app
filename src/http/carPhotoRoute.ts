import { Request, Response } from "express";
import { carPhotoStorage } from "@/storage/carPhotoStorageProvider";

// Public route handler for GET /photos/:carId — streams a car's photo bytes with the right content
// type, or 404 when the car has no photo. Viewing is public (FR-006).
export const carPhotoRouteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { carId } = req.params;
  const storedPhoto = await carPhotoStorage().load(carId);

  if (!storedPhoto) {
    res.status(404).end();
    return;
  }

  res.setHeader("Content-Type", storedPhoto.contentType);
  res.send(storedPhoto.bytes);
};
