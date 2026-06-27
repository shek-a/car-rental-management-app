import { Car, CreateCarInput } from '@/generated/types';
import { CarModel } from '@/model/car';
import { AuthContext, requireAdministrator } from '@/auth/authorization';


export const createCar = async(
  _: unknown, { input }: { input: CreateCarInput }, context: AuthContext
): Promise<Car> => {
    // Fleet management is restricted to administrators (FR-009).
    requireAdministrator(context);

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
