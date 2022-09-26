import { customer, customers } from "./resolvers/queries/customer";
import { car, cars } from "./resolvers/queries/car";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
  addCarToCustomer,
  removeCarFromCustomer
} from "./resolvers/mutations/customer";
import {
  createCar,
  deleteCar,
  updateCar,
} from "./resolvers/mutations/car";
import { fetchCarsByCustomer } from "./resolvers/customer/fetchCarsByCustomer";
import { fetchCustomerByCar } from "./resolvers/car/fetchCustomerByCar";

export const resolvers = {
  Query: {
    customer,
    customers,
    car,
    cars
  },
  Mutation: {
    createCustomer,
    deleteCustomer,
    updateCustomer,
    createCar,
    deleteCar,
    updateCar,
    addCarToCustomer,
    removeCarFromCustomer
  },
  Customer: {
    cars: fetchCarsByCustomer
  },
  Car: {
    customer: fetchCustomerByCar
  }
};
