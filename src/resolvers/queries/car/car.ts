import { Car, QueryCarArgs } from "@/generated/types";
import { CarModel } from "@/model/car";

export const car = async (
  _: any,
  { carId }: QueryCarArgs
): Promise<Car> => {
    const car = await CarModel.findOne({ carId });

    if (!car) {
        throw new Error(`Car id ${carId} does not exist`);
    }

    // @ts-ignore
    return car;
};

