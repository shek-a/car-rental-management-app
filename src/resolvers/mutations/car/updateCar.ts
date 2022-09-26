import { Car, UpdateCarInput, QueryCarArgs } from '@/generated/types';
import { CarModel } from '@/model/car';

export const updateCar = async(
  _: any, { carId, input }: { carId: QueryCarArgs,  input: UpdateCarInput }
): Promise<Car> => {
    const car = await CarModel.findOne({ carId });

    if (!car) {
        throw new Error(`Car id ${carId} does not exist`);
    }

    console.log("carId", carId);
    console.log("input", input);

    const updatedCar = await CarModel.findOneAndUpdate({ carId }, input, {
        new: true
      });
    
      // @ts-ignore
    return updatedCar!!;
}
