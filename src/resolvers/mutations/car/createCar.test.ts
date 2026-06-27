import { createCar } from "./createCar";
import { CarModel } from "@/model/car";
import { createNewCar, createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

const adminContext = { currentCustomer: createAdministrator("admin") };

jest
  .spyOn(CarModel.prototype, "save")
  .mockReturnValue(Promise.resolve(createNewCar("1")));


it("should reject an unauthenticated request", () => {
  expect(
    createCar({}, { input: createNewCar("1") }, { currentCustomer: null })
  ).rejects.toThrow(AuthenticationError);
});

it("should reject a non-administrator", () => {
  expect(
    createCar({}, { input: createNewCar("1") }, { currentCustomer: createNewCustomer("1") })
  ).rejects.toThrow(AuthorizationError);
});

it("should create a car for an administrator", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
  const newCar = createCar({}, { input: createNewCar("1") }, adminContext);
  expect(newCar).resolves.toEqual(createNewCar("1"))
});

it("should throw an error when the provided car id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));
    expect(createCar({}, { input: createNewCar("1") }, adminContext)).
        rejects.toThrow("Car id 1 already exists")
});
