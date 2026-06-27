import { removeCarFromCustomer } from "./removeCarFromCustomer";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { createNewCar, createNewCustomer } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

// A context for a signed-in customer acting on their own account.
const ownerContext = (customerId: string) => ({
  currentCustomer: createNewCustomer(customerId),
});

it("should reject an unauthenticated request", () => {
  expect(
    removeCarFromCustomer({}, { carId: "1", customerId: "1" }, { currentCustomer: null })
  ).rejects.toThrow(AuthenticationError);
});

it("should reject returning against another customer's account", () => {
  expect(
    removeCarFromCustomer({}, { carId: "1", customerId: "1" }, ownerContext("2"))
  ).rejects.toThrow(AuthorizationError);
});

it("should throw an error when the provided car id does not exsist", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(null);

  expect(
    removeCarFromCustomer({}, { carId: "1", customerId: "1" }, ownerContext("1"))
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
    removeCarFromCustomer({}, { carId: "1", customerId: "1" }, ownerContext("1"))
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
    removeCarFromCustomer({}, { carId: "1", customerId: "1" }, ownerContext("1"))
  ).rejects.toThrow("car id 1 does not belong to a customer");
});
