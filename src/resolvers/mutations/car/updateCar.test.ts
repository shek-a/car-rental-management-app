import { updateCar } from "./updateCar";
import { CarModel } from "@/model/car";
import { createNewCar, createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

const adminContext = { currentCustomer: createAdministrator("admin") };

// @ts-expect-error — mock return value stands in for the Mongoose Query result
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
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(createNewCar("1"));

  const updatedCar = updateCar(
    {},
    { carId: "1", input: { plate: "ROVE-9", transmission: "Manual", seats: 2 } },
    adminContext
  );
  expect(updatedCar).resolves.toEqual(createNewCar("1"));
});

it("throws an error when the provided car id does not exist", () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(null);

  expect(
    updateCar({}, { carId: "1", input: createNewCar("1") }, adminContext)
  ).rejects.toThrow("Car id 1 does not exist");
});

it("persists a trimmed location when updating", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(createNewCar("1"));
  const findOneAndUpdate = jest.spyOn(CarModel, "findOneAndUpdate");
  findOneAndUpdate.mockClear();

  await updateCar({}, { carId: "1", input: { location: " Sydney " } }, adminContext);

  const [, update] = findOneAndUpdate.mock.calls[0];
  expect(update).toEqual({ location: "Sydney" });
});

it("rejects a blank location and applies no update", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(createNewCar("1"));
  const findOneAndUpdate = jest.spyOn(CarModel, "findOneAndUpdate");
  findOneAndUpdate.mockClear();

  await expect(
    updateCar({}, { carId: "1", input: { location: "  " } }, adminContext)
  ).rejects.toThrow("A location must not be blank");
  expect(findOneAndUpdate).not.toHaveBeenCalled();
});

it("rejects clearing a location with an explicit null", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(createNewCar("1"));
  const findOneAndUpdate = jest.spyOn(CarModel, "findOneAndUpdate");
  findOneAndUpdate.mockClear();

  await expect(
    updateCar({}, { carId: "1", input: { location: null } }, adminContext)
  ).rejects.toThrow("A car's location can be changed but not cleared");
  expect(findOneAndUpdate).not.toHaveBeenCalled();
});

it("leaves the location untouched when the input omits it", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(createNewCar("1"));
  const findOneAndUpdate = jest.spyOn(CarModel, "findOneAndUpdate");
  findOneAndUpdate.mockClear();

  await updateCar({}, { carId: "1", input: { seats: 2 } }, adminContext);

  const [, update] = findOneAndUpdate.mock.calls[0];
  expect(update).toEqual({ seats: 2 });
});
