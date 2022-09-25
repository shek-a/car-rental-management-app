import { customers } from "./customers";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CustomerModel, "find").mockReturnValue(Promise.resolve([createNewCustomer("1"), createNewCustomer("2")]));


it("should return all customers", () => {
  const allCustomers = customers();
  expect(allCustomers).resolves.toEqual([createNewCustomer("1"), createNewCustomer("2")]);
});
