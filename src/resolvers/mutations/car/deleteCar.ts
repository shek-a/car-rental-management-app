import { Car, QueryCarArgs } from "@/generated/types";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import  { ObjectId } from "mongodb";

export const deleteCar = async (
  _: any,
  { carId }: QueryCarArgs
): Promise<Car> => {
    const car = await CarModel.findOne({ carId });

    if (!car) {
        throw new Error(`Car id ${carId} does not exist`);
    }

    // @ts-ignore
    await CarModel.deleteOne({carId: car.carId});

    await CustomerModel.findOneAndUpdate(
      { _id: car.customer },
      { $pull: { cars: new ObjectId(car.id) } },
      { new: true }
    )

    // @ts-ignore
    return car;
};
