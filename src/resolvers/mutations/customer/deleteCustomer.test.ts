import { deleteCustomer } from "./deleteCustomer";
import { CarModel } from "@/model/car";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CustomerModel, "deleteOne").mockReturnValue(Promise.resolve(createNewCustomer("1")));


it("should delete an existing customer", () => {
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(createNewCustomer("1"));
  // @ts-ignore
  jest.spyOn(CarModel, 'updateMany').mockReturnValueOnce(null);

  const updatedCustomer = deleteCustomer({}, { customerId: "1" });
  expect(updatedCustomer).resolves.toEqual(createNewCustomer("1"));
});

it("should throw an error when the provided customer id does not exsist", () => {
    // @ts-ignore
    jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(null);
    
    expect(deleteCustomer({}, { customerId: "1" })).
        rejects.toThrow("Customer id 1 does not exist")
});
