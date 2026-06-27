import { CAR_MONGO_DB_COLLECTION, CUSTOMER_MONGO_DB_COLLECTION } from "@/config/config";
import { Customer } from "@/generated/types";
import { Schema, model } from "mongoose";

// Persistence shape: the domain Customer plus the internal link to the Better Auth identity.
// authUserId is NOT exposed through GraphQL — it lives only at the persistence/identity boundary.
export interface CustomerEntity extends Customer {
  authUserId?: string;
}

const customerSchema = new Schema<CustomerEntity>({
  // String to match the GraphQL `ID` type and to hold Better Auth identity ids for provisioned
  // customers (previously Number — provisioned ids are non-numeric).
  customerId: String,
  firstName: String,
  lastName: String,
  email: String,
  age: Number,
  role: String,
  authUserId: String,
  cars: [
    {
      type: Schema.Types.ObjectId,
      ref: CAR_MONGO_DB_COLLECTION,
    },
  ],
});

export const CustomerModel = model<CustomerEntity>(
  CUSTOMER_MONGO_DB_COLLECTION,
  customerSchema
);
