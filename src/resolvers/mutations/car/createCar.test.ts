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
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
  const newCar = createCar({}, { input: createNewCar("1") }, adminContext);
  expect(newCar).resolves.toEqual(createNewCar("1"))
});

it("should throw an error when the provided car id already exsists", () => {
    // @ts-expect-error — mock return value stands in for the Mongoose Query result
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));
    expect(createCar({}, { input: createNewCar("1") }, adminContext)).
        rejects.toThrow("Car id 1 already exists")
});

it("persists a trimmed location when one is provided", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(null);
  jest
    .spyOn(CarModel.prototype, "save")
    // Echo the document being saved so the assertion sees what would be persisted.
    .mockImplementationOnce(function (this: unknown) {
      return Promise.resolve(this);
    });

  const car = await createCar(
    {},
    { input: { ...createNewCar("1"), location: " Melbourne " } },
    adminContext
  );

  expect(car.location).toBe("Melbourne");
});

it("rejects a blank location and saves nothing", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(null);
  const save = jest.spyOn(CarModel.prototype, "save");
  save.mockClear();

  await expect(
    createCar({}, { input: { ...createNewCar("1"), location: "   " } }, adminContext)
  ).rejects.toThrow("A location must not be blank");
  expect(save).not.toHaveBeenCalled();
});

it("treats an explicit null location as not provided", async () => {
  // @ts-expect-error — mock return value stands in for the Mongoose Query result
  jest.spyOn(CarModel, "findOne").mockReturnValueOnce(null);
  jest
    .spyOn(CarModel.prototype, "save")
    // Echo the document being saved so the assertion sees what would be persisted.
    .mockImplementationOnce(function (this: unknown) {
      return Promise.resolve(this);
    });

  const car = await createCar(
    {},
    { input: { ...createNewCar("1"), location: null } },
    adminContext
  );

  expect(car.location ?? undefined).toBeUndefined();
});
// Detail-field persistence (plate/year/seats/transmission/fuel/colour) is verified end-to-end
// against real Mongo in test/integration/rentalLifecycle.integration.test.ts.
