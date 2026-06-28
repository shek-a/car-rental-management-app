import { Car, QueryCarArgs } from "@/generated/types";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import  { ObjectId } from "mongodb";
import { AuthContext, requireAdministrator } from "@/auth/authorization";
import { carPhotoStorage } from "@/storage/carPhotoStorageProvider";

export const deleteCar = async (
  _: unknown,
  { carId }: QueryCarArgs,
  context: AuthContext
): Promise<Car> => {
    // Fleet management is restricted to administrators (FR-009).
    requireAdministrator(context);

    const car = await CarModel.findOne({ carId });

    if (!car) {
        throw new Error(`Car id ${carId} does not exist`);
    }

    // @ts-ignore
    await CarModel.deleteOne({carId: car.carId});

    // Remove the car's photo so no orphaned image remains (FR-005).
    await carPhotoStorage().delete(carId);

    await CustomerModel.findOneAndUpdate(
      { _id: car.customer },
      { $pull: { cars: new ObjectId(car.id) } },
      { new: true }
    )

    // @ts-ignore
    return car;
};
