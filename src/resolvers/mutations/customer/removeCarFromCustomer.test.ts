import { removeCarFromCustomer } from "./removeCarFromCustomer";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { createNewCar, createNewCustomer } from "@/testing/utilities";

it("should throw an error when the provided car id does not exsist", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(null);

  expect(removeCarFromCustomer({}, { carId: "1", customerId: "1" })).rejects.toThrow(
    "Car id 1 does not exist"
  );
});

it("should throw an error when the provided customer id does not exsist", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValue(createNewCar("1"));

  // @ts-ignore
  jest.spyOn(CustomerModel, "findOne").mockReturnValueOnce({
    // @ts-ignore
    populate: jest.fn().mockReturnValueOnce(null),
  });

  expect(removeCarFromCustomer({}, { carId: "1", customerId: "1" })).rejects.toThrow(
    "Customer id 1 does not exist"
  );
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

  expect(removeCarFromCustomer({}, { carId: "1", customerId: "1" })).rejects.toThrow(
    "car id 1 does not belong to a customer"
  );
});
