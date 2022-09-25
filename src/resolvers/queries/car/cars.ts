import { Car } from '@/generated/types';
import { CarModel } from '@/model/car';

export const cars = async(): Promise<Array<Car>> => {
    return CarModel.find({})
}
