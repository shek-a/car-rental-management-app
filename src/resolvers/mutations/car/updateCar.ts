import { Car, MutationUpdateCarArgs } from '@/generated/types';
import { CarModel } from '@/model/car';
import { AuthContext, requireAdministrator } from '@/auth/authorization';

export const updateCar = async (
  _: unknown,
  { carId, input }: MutationUpdateCarArgs,
  context: AuthContext
): Promise<Car> => {
    // Fleet management is restricted to administrators (FR-009).
    requireAdministrator(context);

    const car = await CarModel.findOne({ carId });

    if (!car) {
        throw new Error(`Car id ${carId} does not exist`);
    }

    const updatedCar = await CarModel.findOneAndUpdate({ carId }, input, {
        new: true
      });

      // @ts-ignore  (mongoose hydrated document → Car)
    return updatedCar!;
}
