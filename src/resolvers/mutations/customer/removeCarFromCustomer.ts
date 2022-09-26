import { MutationRemoveCarFromCustomerArgs } from "@/generated/types";
import { Customer } from "@/generated/types";
import { CustomerModel } from "@/model/customer";
import { CarModel } from "@/model/car";

export const removeCarFromCustomer = async (
  _: any,
  { carId, customerId }: MutationRemoveCarFromCustomerArgs
): Promise<Customer> => {
  const car = await CarModel.findOne({ carId });

  if (!car) {
      throw new Error(`Car id ${carId} does not exist`);
  }

  const customer = await CustomerModel.findOne({ customerId }).populate("cars");
  console.log('customer', customer);

  if (!customer) {
      throw new Error(`Customer id ${customerId} does not exist`);
  }

 const carIdPresent = customer.cars?.some(car => car.carId == carId);

 if (!carIdPresent) {
  throw new Error(`car id ${carId} does not belong to customr id ${customerId}`);
 }

 if (car.customer) {
   car.customer = null;
 } else {
    throw new Error(`car id ${carId} does not belong to a customer`);
 }

await car.save();

customer.cars?.splice(customer.cars?.findIndex(car => car.carId === carId), 1);
const savedCustomer = await customer.save();

  // @ts-ignore
  return savedCustomer;
};