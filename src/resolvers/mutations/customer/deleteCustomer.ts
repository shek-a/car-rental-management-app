import { Customer, QueryCustomerArgs } from "@/generated/types";
import { CustomerModel } from "@/model/customer";

export const deleteCustomer = async (
  _: any,
  { customerId }: QueryCustomerArgs
): Promise<Customer> => {
    const customer = await CustomerModel.findOne({ customerId });

    if (!customer) {
        throw new Error(`Customer id ${customerId} does not exist`);
    }

    // @ts-ignore
    await CustomerModel.deleteOne({customerId: customer.customerId});

    // @ts-ignore
    return customer;
};
