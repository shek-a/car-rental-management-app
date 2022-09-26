import { car } from "./car";
import { CarModel } from "@/model/car";
import { createNewCar } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CarModel, "findOne").mockReturnValue(Promise.resolve(createNewCar("1")));


it("should return an existing car by carId", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));

  // @ts-ignore
  const searchedCar = car({}, { carId: "1" });
  expect(searchedCar).resolves.toEqual(createNewCar("1"));
});

it("should throw an error when the provided car id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
    
    // @ts-ignore
    expect(car({}, { carId: "1" })).
        rejects.toThrow("Car id 1 does not exist")
});