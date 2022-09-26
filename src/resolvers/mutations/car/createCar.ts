import { Car, CreateCarInput } from '@/generated/types';
import { CarModel } from '@/model/car';


export const createCar = async(
  _: any, { input }: { input: CreateCarInput }
): Promise<Car> => {
    const carId = input.carId;
    const car = await CarModel.findOne({ carId });

    if (car) {
        throw new Error(`Car id ${carId} already exists`);
    }

    const newCar = new CarModel(
        input
    );
    const savedCar = await newCar.save();

    // @ts-ignore
    return savedCar;
}
