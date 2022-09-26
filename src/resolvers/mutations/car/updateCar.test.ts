import { updateCar } from "./updateCar";
import { CarModel } from "@/model/car";
import { createNewCar } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CarModel, "findOneAndUpdate").mockReturnValue(Promise.resolve(createNewCar("1")));


it("should update an existing car", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));

  // @ts-ignore
  const updatedCar = updateCar({}, { carId: "1", input: createNewCar("1")});
  expect(updatedCar).resolves.toEqual(createNewCar("1"));
});

it("should throw an error when the provided car id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
    
    // @ts-ignore
    expect(updateCar({}, { carId: "1", input: createNewCar("1")})).
        rejects.toThrow("Car id 1 does not exist")
});
