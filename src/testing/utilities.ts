import {
  CarType,
  Car,
  Customer,
} from "@/generated/types";

export const createNewCustomer = (customerId: string, cars?: Array<Car>): Customer => {
  return {
    customerId,
    firstName: "Tom",
    lastName: "Smith",
    email: "Tom.Smith@gmail.com",
    age: 40,
    cars
  };
};

export const createNewCar = (carId: string, customer?: Customer): Car => {
  return {
    carId,
    make: "Toyota",
    model: "Corolla",
    type: CarType.Sedan,
    costPerDay: 60.5,
    customer
  };
};
