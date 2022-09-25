import { Customer } from '@/generated/types';
import { CustomerModel } from '@/model/customer';

export const customers = async(): Promise<Array<Customer>> => {
    return CustomerModel.find({});
}
