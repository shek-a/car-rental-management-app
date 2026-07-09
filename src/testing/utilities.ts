import {
  CarType,
  Car,
  Customer,
  CustomerRole,
  CreateCustomerInput,
  FleetStatus,
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

export const createNewCar = (
  carId: string,
  customer?: Customer,
  location?: string
): Car => {
  return {
    carId,
    make: "Toyota",
    model: "Corolla",
    type: CarType.Sedan,
    costPerDay: 60.5,
    plate: `ROVE-${carId}`,
    year: 2025,
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    colour: "Pearl White",
    // status is derived by the Car.status field resolver; a fixture placeholder for the required field.
    status: FleetStatus.Available,
    customer,
    ...(location !== undefined && { location }),
  };
};

// A car fixture that is currently rented — carries a lease/return date (the persisted backing for a
// RentalPeriod). Status is a placeholder; the real value is derived by the field resolver.
export const createRentedCar = (
  carId: string,
  customer: Customer,
  leaseDate: Date,
  dueBackDate: Date,
  location?: string
): Car => {
  return {
    ...createNewCar(carId, customer, location),
    leasedDate: leaseDate,
    returnDate: dueBackDate,
    status: FleetStatus.Leased,
  };
};
