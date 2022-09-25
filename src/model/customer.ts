import { CUSTOMER_MONGO_DB_CONNECTION } from "@/config/config";
import { Customer } from "@/generated/types";
import { Schema, model } from "mongoose";

const customerSchema = new Schema<Customer>({
  customerId: Number,
  firstName: String,
  lastName: String,
  email: String,
  age: Number,
});

export const CustomerModel = model<Customer>(CUSTOMER_MONGO_DB_CONNECTION, customerSchema);
