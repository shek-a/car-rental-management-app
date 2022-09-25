import { CAR_MONGO_DB_COLLECTION, CUSTOMER_MONGO_DB_COLLECTION } from "@/config/config";
import { Customer } from "@/generated/types";
import { Schema, model } from "mongoose";

const customerSchema = new Schema<Customer>({
  customerId: Number,
  firstName: String,
  lastName: String,
  email: String,
  age: Number,
  cars: [{
    type: Schema.Types.ObjectId,
    ref: CAR_MONGO_DB_COLLECTION
  }]
});

export const CustomerModel = model<Customer>(CUSTOMER_MONGO_DB_COLLECTION, customerSchema);
