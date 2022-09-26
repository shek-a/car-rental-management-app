import { MutationAddCarToCustomerArgs } from "@/generated/types";
import { Customer } from "@/generated/types";
import { CustomerModel } from "@/model/customer";
import { CarModel } from "@/model/car";

export const addCarToCustomer = async (
  _: any,
  { carId, customerId }: MutationAddCarToCustomerArgs
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

 if (carIdPresent) {
  throw new Error(`Customer id ${customerId} already has car id ${carId}`);
 }

 if (car.customer) {
   throw new Error(`Car id ${carId} is already leased out`)
 } else {
    car.customer = customer;
 }

await car.save();

customer.cars?.push(car);
const savedCustomer = await customer.save();

  // @ts-ignore
  return savedCustomer;
};
