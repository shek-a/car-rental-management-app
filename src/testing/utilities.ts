import { CreateCustomerInput } from "@/generated/types";

export const createNewCustomer = (customerId: string): CreateCustomerInput => {
    return {
      customerId,
      firstName: "Tom",
      lastName: "Smit",
      email: "Tom.Smith@gmail.com",
      age: 40,
    };
  };