import { deleteCar } from "./deleteCar";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { createNewCar, createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

const adminContext = { currentCustomer: createAdministrator("admin") };

// @ts-ignore
jest.spyOn(CarModel, "deleteOne").mockReturnValue(Promise.resolve(createNewCar("1")));


it("should reject an unauthenticated request", () => {
  expect(
    deleteCar({}, { carId: "1" }, { currentCustomer: null })
  ).rejects.toThrow(AuthenticationError);
});

it("should reject a non-administrator", () => {
  expect(
    deleteCar({}, { carId: "1" }, { currentCustomer: createNewCustomer("1") })
  ).rejects.toThrow(AuthorizationError);
});

it("should delete an existing car for an administrator", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOneAndUpdate').mockReturnValueOnce(null);

  const updatedCar = deleteCar({}, { carId: "1" }, adminContext);
  expect(updatedCar).resolves.toEqual(createNewCar("1"));
});

it("should throw an error when the provided car id does not exist", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);

    expect(deleteCar({}, { carId: "1" }, adminContext)).
        rejects.toThrow("Car id 1 does not exist")
});
