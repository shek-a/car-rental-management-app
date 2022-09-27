import { Customer, QueryCustomerArgs } from "@/generated/types";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { Schema } from "mongoose";

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

    await CarModel.updateMany(
      { customer },
      { customer: null },
      { new: true }
    );  

    // @ts-ignore
    return customer;
};