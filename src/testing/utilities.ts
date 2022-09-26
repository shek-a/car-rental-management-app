import {
  CarType,
  CreateCarInput,
  CreateCustomerInput,
} from "@/generated/types";

export const createNewCustomer = (customerId: string): CreateCustomerInput => {
  return {
    customerId,
    firstName: "Tom",
    lastName: "Smith",
    email: "Tom.Smith@gmail.com",
    age: 40,
  };
};

export const createNewCar = (carId: string): CreateCarInput => {
  return {
    carId,
    make: "Toyota",
    model: "Corolla",
    type: CarType.Sedan,
    costPerDay: 60.5,
  };
};
