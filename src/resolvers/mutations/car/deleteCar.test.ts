import { deleteCar } from "./deleteCar";
import { CarModel } from "@/model/car";
import { createNewCar } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CarModel, "deleteOne").mockReturnValue(Promise.resolve(createNewCar("1")));


it("should delete an existing car", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));

  // @ts-ignore
  const updatedCar = deleteCar({}, { carId: "1" });
  expect(updatedCar).resolves.toEqual(createNewCar("1"));
});

it("should throw an error when the provided car id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
    
    // @ts-ignore
    expect(deleteCar({}, { carId: "1" })).
        rejects.toThrow("Car id 1 does not exist")
});
