import { CreateCustomerInput } from '@/generated/types';
import { Customer } from '@/generated/types';
import { CustomerModel } from '@/model/customer';


export const createCustomer = async(
  _: any, { input }: { input: CreateCustomerInput }
): Promise<Customer> => {
    const customerId = input.customerId;
    const customer = await CustomerModel.findOne({ customerId });

    if (customer) {
        throw new Error(`Customer id ${customerId} already exists`);
    }

    const newCustomer = new CustomerModel(
        input
    );
    const savedCustomer = await newCustomer.save();

    // @ts-ignore
    return savedCustomer;
}
