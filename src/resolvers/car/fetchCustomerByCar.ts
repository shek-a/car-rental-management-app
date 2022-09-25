import { Car, Customer } from '@/generated/types';
import { CustomerModel } from '@/model/customer';

export const fetchCustomerByCar = async(
    car: Car
): Promise<Customer> => {

    // @ts-ignore
    return CustomerModel.findOne({ _id: car.customer });
}
