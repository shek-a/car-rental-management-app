import { updateCar } from "./updateCar";
import { CarModel } from "@/model/car";
import { createNewCar, createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

const adminContext = { currentCustomer: createAdministrator("admin") };

// @ts-ignore
jest.spyOn(CarModel, "findOneAndUpdate").mockReturnValue(Promise.resolve(createNewCar("1")));

it("rejects an unauthenticated request", () => {
  expect(
    updateCar({}, { carId: "1", input: createNewCar("1") }, { currentCustomer: null })
  ).rejects.toThrow(AuthenticationError);
});

it("rejects a non-administrator", () => {
  expect(
    updateCar({}, { carId: "1", input: createNewCar("1") }, { currentCustomer: createNewCustomer("1") })
  ).rejects.toThrow(AuthorizationError);
});

it("updates an existing car (including detail fields) for an administrator", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(createNewCar("1"));

  const updatedCar = updateCar(
    {},
    { carId: "1", input: { plate: "ROVE-9", transmission: "Manual", seats: 2 } },
    adminContext
  );
  expect(updatedCar).resolves.toEqual(createNewCar("1"));
});

it("throws an error when the provided car id does not exist", () => {
  // @ts-ignore
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(null);

  expect(
    updateCar({}, { carId: "1", input: createNewCar("1") }, adminContext)
  ).rejects.toThrow("Car id 1 does not exist");
});
