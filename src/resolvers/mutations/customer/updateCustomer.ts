import { Customer, UpdateCustomerInput, QueryCustomerArgs } from '@/generated/types';
import { CustomerModel } from '@/model/customer';

export const updateCustomer = async(
  _: any, { customerId, input }: { customerId: QueryCustomerArgs,  input: UpdateCustomerInput }
): Promise<Customer> => {
    const customer = await CustomerModel.findOne({ customerId });

    if (!customer) {
        throw new Error(`Customer id ${customerId} does not exist`);
    }
    const updatedCustomer = await CustomerModel.findOneAndUpdate({ customerId }, input, {
        new: true
      });
    
      // @ts-ignore
    return updatedCustomer!!;
}
