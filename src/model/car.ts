import {
  CAR_MONGO_DB_COLLECTION,
  CUSTOMER_MONGO_DB_COLLECTION,
} from "@/config/config";
import { Car } from "@/generated/types";
import { Schema, model } from "mongoose";

export const carSchema = new Schema<Car>({
  carId: Number,
  make: String,
  model: String,
  type: String,
  costPerDay: Number,
  leasedDate: Date,
  returnDate: Date,
  customer: {
    type: Schema.Types.ObjectId,
    ref: CUSTOMER_MONGO_DB_COLLECTION,
  },
});

export const CarModel = model<Car>(CAR_MONGO_DB_COLLECTION, carSchema);
