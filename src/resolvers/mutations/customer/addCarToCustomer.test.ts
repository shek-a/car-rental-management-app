import { addCarToCustomer } from "./addCarToCustomer";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { createNewCar, createNewCustomer } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

// A context for a signed-in customer acting on their own account.
const ownerContext = (customerId: string) => ({
  currentCustomer: createNewCustomer(customerId),
});

// @ts-ignore
jest.spyOn(CustomerModel, "findOneAndUpdate").mockReturnValue(Promise.resolve(createNewCustomer("1")));

it("should reject an unauthenticated request", () => {
  expect(
    addCarToCustomer({}, { carId: "1", customerId: "1" }, { currentCustomer: null })
  ).rejects.toThrow(AuthenticationError);
});

it("should reject renting against another customer's account", () => {
  expect(
    addCarToCustomer({}, { carId: "1", customerId: "1" }, ownerContext("2"))
  ).rejects.toThrow(AuthorizationError);
});

it("should add a car to a customer", () => {
  const newCar = new CarModel(createNewCar("1"));

  const newCustomer = new CustomerModel(createNewCustomer("1"));

  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(Promise.resolve(newCar));

  // @ts-ignore
  jest.spyOn(CustomerModel, "findOne").mockReturnValueOnce({
    // @ts-ignore
    populate: jest.fn().mockReturnValueOnce(Promise.resolve(newCustomer)),
  });

  jest
    .spyOn(CarModel.prototype, "save")
    .mockReturnValue(Promise.resolve(createNewCar("1")));

  jest
    .spyOn(CustomerModel.prototype, "save")
    .mockReturnValue(Promise.resolve(createNewCustomer("1")));

  const updatedCustomer = addCarToCustomer(
    {},
    { carId: "1", customerId: "1" },
    ownerContext("1")
  );
  expect(updatedCustomer).resolves.toEqual(createNewCustomer("1"));
});

it("should throw an error when the provided car id does not exsist", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(null);

  expect(
    addCarToCustomer({}, { carId: "1", customerId: "1" }, ownerContext("1"))
  ).rejects.toThrow("Car id 1 does not exist");
});

it("should throw an error when the provided customer id does not exsist", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(createNewCar("1"));

  // @ts-ignore
  jest.spyOn(CustomerModel, "findOne").mockReturnValueOnce({
    // @ts-ignore
    populate: jest.fn().mockReturnValueOnce(null),
  });

  expect(
    addCarToCustomer({}, { carId: "1", customerId: "1" }, ownerContext("1"))
  ).rejects.toThrow("Customer id 1 does not exist");
});

it("should throw an error when the provided car id belongs to another customer", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(createNewCar("1"));

  // @ts-ignore
  jest.spyOn(CustomerModel, "findOne").mockReturnValueOnce({
    // @ts-ignore
    populate: jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve(createNewCustomer("1", [createNewCar("1")]))
      ),
  });

  expect(
    addCarToCustomer({}, { carId: "1", customerId: "1" }, ownerContext("1"))
  ).rejects.toThrow("Customer id 1 already has car id 1");
});
