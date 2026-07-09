import { customer, customers } from "./resolvers/queries/customer";
import { car, cars, searchAvailableCars } from "./resolvers/queries/car";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
  addCarToCustomer,
  removeCarFromCustomer,
  grantAdministratorRole
} from "./resolvers/mutations/customer";
import {
  createCar,
  deleteCar,
  updateCar,
  addCarPhoto,
  removeCarPhoto,
} from "./resolvers/mutations/car";
import { fetchCarsByCustomer } from "./resolvers/customer/fetchCarsByCustomer";
import { fetchCustomerByCar } from "./resolvers/car/fetchCustomerByCar";
import { fetchPhotoByCar } from "./resolvers/car/fetchPhotoByCar";
import { fetchStatusByCar } from "./resolvers/car/fetchStatusByCar";
import { fetchRentalPeriodByCar } from "./resolvers/car/fetchRentalPeriodByCar";

export const resolvers = {
  Query: {
    customer,
    customers,
    car,
    cars,
    searchAvailableCars
  },
  Mutation: {
    createCustomer,
    deleteCustomer,
    updateCustomer,
    createCar,
    deleteCar,
    updateCar,
    addCarToCustomer,
    removeCarFromCustomer,
    grantAdministratorRole,
    addCarPhoto,
    removeCarPhoto
  },
  Customer: {
    cars: fetchCarsByCustomer
  },
  Car: {
    customer: fetchCustomerByCar,
    photo: fetchPhotoByCar,
    status: fetchStatusByCar,
    rentalPeriod: fetchRentalPeriodByCar
  }
};
