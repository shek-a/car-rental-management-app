import {
  CarType,
  Car,
  Customer,
  CustomerRole,
  CreateCustomerInput,
} from "@/generated/types";

export const createCustomerInput = (
  customerId: string
): CreateCustomerInput => {
  return {
    customerId,
    firstName: "Tom",
    lastName: "Smith",
    email: "Tom.Smith@gmail.com",
    age: 40,
  };
};

export const createNewCustomer = (
  customerId: string,
  cars?: Array<Car>,
  role: CustomerRole = CustomerRole.Customer
): Customer => {
  return {
    customerId,
    firstName: "Tom",
    lastName: "Smith",
    email: "Tom.Smith@gmail.com",
    age: 40,
    role,
    cars,
  };
};

export const createAdministrator = (
  customerId: string,
  cars?: Array<Car>
): Customer => createNewCustomer(customerId, cars, CustomerRole.Administrator);

export const createNewCar = (carId: string, customer?: Customer): Car => {
  return {
    carId,
    make: "Toyota",
    model: "Corolla",
    type: CarType.Sedan,
    costPerDay: 60.5,
    customer,
  };
};
