import {
  CAR_MONGO_DB_COLLECTION,
  CUSTOMER_MONGO_DB_COLLECTION,
} from "@/config/config";
import { Car } from "@/generated/types";
import { Schema, model } from "mongoose";

// Metadata describing a car's stored photo. The image bytes live in the storage provider; only
// this metadata is persisted on the Car. `storageKey` is how the provider locates the bytes.
export interface CarPhotoMetadata {
  contentType: string;
  storageKey: string;
  addedAt: Date;
}

// Persistence shape of a car. Omits the GraphQL fields that are *derived* and never stored:
// `status` (computed from the rental period) and `rentalPeriod` (projected from leasedDate/returnDate).
// Adds `photoMetadata`, the stored backing for the client-facing `Car.photo` projection.
export interface CarEntity extends Omit<Car, "status" | "rentalPeriod"> {
  photoMetadata?: CarPhotoMetadata;
}

// Defined as a sub-schema with `default: undefined` so the field is genuinely absent when a car has
// no photo (and after clearing it) — rather than Mongoose auto-creating an empty `{}`.
const carPhotoMetadataSchema = new Schema<CarPhotoMetadata>(
  {
    contentType: String,
    storageKey: String,
    addedAt: Date,
  },
  { _id: false }
);

export const carSchema = new Schema<CarEntity>({
  // String to match the GraphQL `ID` type and to key photo storage by car id.
  carId: String,
  make: String,
  model: String,
  type: String,
  costPerDay: Number,
  leasedDate: Date,
  returnDate: Date,
  plate: String,
  year: Number,
  seats: Number,
  transmission: String,
  fuel: String,
  colour: String,
  customer: {
    type: Schema.Types.ObjectId,
    ref: CUSTOMER_MONGO_DB_COLLECTION,
  },
  photoMetadata: {
    type: carPhotoMetadataSchema,
    default: undefined,
  },
});

export const CarModel = model<CarEntity>(CAR_MONGO_DB_COLLECTION, carSchema);
