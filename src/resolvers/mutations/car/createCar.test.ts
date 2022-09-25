import { createCar } from "./createCar";
import { CarModel } from "@/model/car";
import { createNewCar } from "@/testing/utilities";

jest
  .spyOn(CarModel.prototype, "save")
  .mockReturnValue(Promise.resolve(createNewCar("1")));


it("should create a car", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
  const newCar = createCar({}, { input: createNewCar("1") });
  expect(newCar).resolves.toEqual(createNewCar("1"))
});

it("should throw an error when the provided car id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));
    expect(createCar({}, { input: createNewCar("1") })).
        rejects.toThrow("Car id 1 already exists")
});

