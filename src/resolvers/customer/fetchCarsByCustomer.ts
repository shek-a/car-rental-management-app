import { Car, Customer } from '@/generated/types';
import { CarModel } from '@/model/car';

export const fetchCarsByCustomer = async(
    customer: Customer
): Promise<Array<Car>> => {

    return CarModel.find({ customer });
}
