import { deleteCustomer } from "./deleteCustomer";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CustomerModel, "deleteOne").mockReturnValue(Promise.resolve(createNewCustomer("1")));


it("should delete an existing customer", () => {
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(createNewCustomer("1"));

  // @ts-ignore
  const updatedCustomer = deleteCustomer({}, { customerId: "1" });
  expect(updatedCustomer).resolves.toEqual(createNewCustomer("1"));
});

it("should throw an error when the provided customer id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(null);
    
    // @ts-ignore
    expect(deleteCustomer({}, { customerId: "1" })).
        rejects.toThrow("Customer id 1 does not exist")
});
