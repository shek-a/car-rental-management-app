import { Car, CreateCarInput } from '@/generated/types';
import { CarModel } from '@/model/car';
import { AuthContext, requireAdministrator } from '@/auth/authorization';
import { createLocation } from '@/domain/car/location';


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

    // A provided location is validated/trimmed by the Location value object; a null or omitted
    // location means the car is created without one.
    const { location, ...carDetails } = input;
    const newCar = new CarModel(
        location != null
            ? { ...carDetails, location: createLocation(location).value }
            : carDetails
    );
    const savedCar = await newCar.save();

    // @ts-expect-error — the hydrated Mongoose document stands in for the GraphQL Car
    return savedCar;
}
