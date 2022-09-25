import { customers } from "./customers";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

// @ts-ignore
jest.spyOn(CustomerModel, "find").mockReturnValue(Promise.resolve([createNewCustomer("1"), createNewCustomer("2")]));


it("should return all customers", () => {

  const allCustomer = customers();
  expect(allCustomer).resolves.toEqual([createNewCustomer("1"), createNewCustomer("2")]);
});
