import { updateCustomer } from "./updateCustomer";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CustomerModel, "findOneAndUpdate").mockReturnValue(Promise.resolve(createNewCustomer("1")));


it("should update an existing customer", () => {
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(createNewCustomer("1"));

  // @ts-ignore
  const updatedCustomer = updateCustomer({}, { customerId: "1", input: createNewCustomer("1")});
  expect(updatedCustomer).resolves.toEqual(createNewCustomer("1"));
});

it("should throw an error when the provided customer id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(null);
    
    // @ts-ignore
    expect(updateCustomer({}, { customerId: "1", input: createNewCustomer("1")})).
        rejects.toThrow("Customer id 1 does not exist")
});
