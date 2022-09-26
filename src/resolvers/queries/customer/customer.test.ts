import { customer } from "./customer";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CustomerModel, "findOne").mockReturnValue(Promise.resolve(createNewCustomer("1")));


it("should return an existing customer by customerId", () => {
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(createNewCustomer("1"));

  // @ts-ignore
  const searchedCustomer = customer({}, { customerId: "1" });
  expect(searchedCustomer).resolves.toEqual(createNewCustomer("1"));
});

it("should throw an error when the provided customer id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(null);
    
    // @ts-ignore
    expect(customer({}, { customerId: "1" })).
        rejects.toThrow("Customer id 1 does not exist")
});