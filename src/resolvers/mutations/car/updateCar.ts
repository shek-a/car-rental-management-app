import { Car, MutationUpdateCarArgs } from '@/generated/types';
import { CarModel } from '@/model/car';
import { AuthContext, requireAdministrator } from '@/auth/authorization';
import { createLocation } from '@/domain/car/location';

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

    // Passing a null location through would let Mongoose silently unset the field, so clearing is
    // rejected explicitly; a provided location is validated/trimmed by the Location value object.
    if (input.location === null) {
        throw new Error("A car's location can be changed but not cleared");
    }
    const update =
        input.location !== undefined
            ? { ...input, location: createLocation(input.location).value }
            : input;

    const updatedCar = await CarModel.findOneAndUpdate({ carId }, update, {
        new: true
      });

      // @ts-expect-error — the hydrated Mongoose document stands in for the GraphQL Car
    return updatedCar!;
}
