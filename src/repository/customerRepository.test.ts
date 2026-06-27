import {
  findByAuthUserId,
  findByEmail,
  findByCustomerId,
  create,
  update,
} from "./customerRepository";
import { CustomerModel } from "@/model/customer";
import { createNewCustomer } from "@/testing/utilities";
import { CustomerRole } from "@/generated/types";

// A query whose .exec() resolves to the given value. Mongoose's Query type is impractical to
// reconstruct in a mock, so the boundary is stubbed and the filter argument is captured below.
const queryResolving = (value: unknown) =>
  ({ exec: jest.fn().mockResolvedValue(value) } as unknown as ReturnType<
    typeof CustomerModel.findOne
  >);

describe("customer repository", () => {
  afterEach(() => jest.restoreAllMocks());

  it("finds a customer by auth user id", async () => {
    const customer = createNewCustomer("1");
    const findOne = jest
      .spyOn(CustomerModel, "findOne")
      .mockReturnValue(queryResolving(customer));

    const result = await findByAuthUserId("google-123");

    expect(result).toEqual(customer);
    expect(findOne).toHaveBeenCalledWith({ authUserId: "google-123" });
  });

  it("finds a customer by email", async () => {
    const customer = createNewCustomer("1");
    const findOne = jest
      .spyOn(CustomerModel, "findOne")
      .mockReturnValue(queryResolving(customer));

    const result = await findByEmail("tom.smith@gmail.com");

    expect(result).toEqual(customer);
    expect(findOne).toHaveBeenCalledWith({ email: "tom.smith@gmail.com" });
  });

  it("finds a customer by customer id", async () => {
    const customer = createNewCustomer("1");
    const findOne = jest
      .spyOn(CustomerModel, "findOne")
      .mockReturnValue(queryResolving(customer));

    const result = await findByCustomerId("1");

    expect(result).toEqual(customer);
    expect(findOne).toHaveBeenCalledWith({ customerId: "1" });
  });

  it("returns null when no customer matches", async () => {
    jest
      .spyOn(CustomerModel, "findOne")
      .mockReturnValue(queryResolving(null));

    expect(await findByAuthUserId("missing")).toBeNull();
  });

  it("creates a new customer", async () => {
    const customer = createNewCustomer("1");
    const save = jest
      .spyOn(CustomerModel.prototype, "save")
      .mockResolvedValue(customer);

    const result = await create(customer);

    expect(result).toEqual(customer);
    expect(save).toHaveBeenCalled();
  });

  it("updates only the supplied fields of an existing customer, returning the updated record", async () => {
    const updated = createNewCustomer("1", undefined, CustomerRole.Administrator);
    const findOneAndUpdate = jest
      .spyOn(CustomerModel, "findOneAndUpdate")
      .mockReturnValue(queryResolving(updated) as ReturnType<
        typeof CustomerModel.findOneAndUpdate
      >);

    const result = await update("1", { role: CustomerRole.Administrator });

    expect(result).toEqual(updated);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { customerId: "1" },
      { $set: { role: CustomerRole.Administrator } },
      { new: true }
    );
  });
});
