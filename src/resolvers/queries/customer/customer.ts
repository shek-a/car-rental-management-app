import { Customer, QueryCustomerArgs } from "@/generated/types";
import { CustomerModel } from "@/model/customer";

export const customer = async (
  _: any,
  { customerId }: QueryCustomerArgs
): Promise<Customer> => {
    const customer = await CustomerModel.findOne({ customerId });

    if (!customer) {
        throw new Error(`Customer id ${customerId} does not exist`);
    }

    // @ts-ignore
    return customer;
};

