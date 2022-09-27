import { deleteCar } from "./deleteCar";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { createNewCar } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CarModel, "deleteOne").mockReturnValue(Promise.resolve(createNewCar("1")));


it("should delete an existing car", () => {
  // @ts-ignore
  jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(createNewCar("1"));
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOneAndUpdate').mockReturnValueOnce(null);

  const updatedCar = deleteCar({}, { carId: "1" });
  expect(updatedCar).resolves.toEqual(createNewCar("1"));
});

it("should throw an error when the provided car id does not exist", () => {
    // @ts-ignore
    jest.spyOn(CarModel, 'findOne').mockReturnValueOnce(null);
    
    expect(deleteCar({}, { carId: "1" })).
        rejects.toThrow("Car id 1 does not exist")
});
