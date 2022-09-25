import { customer, customers } from "./resolvers/queries/customer";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "./resolvers/mutations/customer";

export const resolvers = {
  Query: {
    customer,
    customers,
  },
  Mutation: {
    createCustomer,
    deleteCustomer,
    updateCustomer,
  },
};
