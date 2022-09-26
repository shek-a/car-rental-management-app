import { cars } from "./cars";
import { CarModel } from "@/model/car";
import { createNewCar } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CarModel, "find").mockReturnValue(Promise.resolve([createNewCar("1"), createNewCar("2")]));


it("should return all cars", () => {
  const allCars = cars();
  expect(allCars).resolves.toEqual([createNewCar("1"), createNewCar("2")]);
});
