import { Car, QueryCarArgs } from "@/generated/types";
import { CarModel } from "@/model/car";

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

    // @ts-ignore
    return car;
};
