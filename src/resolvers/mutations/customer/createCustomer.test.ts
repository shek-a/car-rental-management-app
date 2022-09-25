import { createCustomer } from "./createCustomer";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";

jest
  .spyOn(CustomerModel.prototype, "save")
  .mockReturnValue(Promise.resolve(createNewCustomer("1")));


it("should create a customer", () => {
  // @ts-ignore
  jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(null);
  const newCustomer = createCustomer({}, { input: createNewCustomer("1") });
  expect(newCustomer).resolves.toEqual(createNewCustomer("1"))
});

it("should throw an error when provided customer id already exsists", () => {
    // @ts-ignore
    jest.spyOn(CustomerModel, 'findOne').mockReturnValueOnce(createNewCustomer("1"));
    expect(createCustomer({}, { input: createNewCustomer("1") })).
        rejects.toThrow("Customer id 1 already exists")
});

