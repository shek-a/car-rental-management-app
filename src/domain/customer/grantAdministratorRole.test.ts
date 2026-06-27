import { grantAdministratorRole } from "./grantAdministratorRole";
import * as customerRepository from "@/repository/customerRepository";
import { createNewCustomer, createAdministrator } from "@/testing/utilities";
import { CustomerRole } from "@/generated/types";

jest.mock("@/repository/customerRepository");

const repo = customerRepository as jest.Mocked<typeof customerRepository>;

describe("grant administrator role", () => {
  beforeEach(() => jest.resetAllMocks());

  it("promotes an existing customer to administrator", async () => {
    repo.findByCustomerId.mockResolvedValue(createNewCustomer("1"));
    repo.update.mockResolvedValue(createAdministrator("1"));

    const result = await grantAdministratorRole("1");

    expect(repo.update).toHaveBeenCalledWith("1", {
      role: CustomerRole.Administrator,
    });
    expect(result.role).toBe(CustomerRole.Administrator);
  });

  it("throws when the customer does not exist", async () => {
    repo.findByCustomerId.mockResolvedValue(null);

    await expect(grantAdministratorRole("missing")).rejects.toThrow(
      "Customer id missing does not exist"
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("is idempotent for a customer who is already an administrator", async () => {
    repo.findByCustomerId.mockResolvedValue(createAdministrator("1"));
    repo.update.mockResolvedValue(createAdministrator("1"));

    const result = await grantAdministratorRole("1");

    expect(result.role).toBe(CustomerRole.Administrator);
  });
});
