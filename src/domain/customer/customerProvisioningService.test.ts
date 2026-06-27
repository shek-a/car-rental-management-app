import { provisionCustomer } from "./customerProvisioningService";
import * as customerRepository from "@/repository/customerRepository";
import { createNewCustomer } from "@/testing/utilities";
import { CustomerRole } from "@/generated/types";
import { SEED_ADMIN_EMAIL } from "@/config/config";

jest.mock("@/repository/customerRepository");

const repo = customerRepository as jest.Mocked<typeof customerRepository>;

const identity = {
  authUserId: "google-123",
  email: "renter@gmail.com",
  firstName: "Tom",
  lastName: "Smith",
};

describe("customer provisioning", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns the existing customer when one is already linked to the identity", async () => {
    const existing = createNewCustomer("1");
    repo.findByAuthUserId.mockResolvedValue({ ...existing, authUserId: identity.authUserId });

    const result = await provisionCustomer(identity);

    expect(result.customerId).toBe("1");
    expect(repo.findByEmail).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("links an existing customer by email on first sign-in (no duplicate created)", async () => {
    const existing = createNewCustomer("1");
    repo.findByAuthUserId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(existing);
    repo.update.mockResolvedValue({ ...existing, authUserId: identity.authUserId });

    const result = await provisionCustomer(identity);

    expect(repo.update).toHaveBeenCalledWith("1", { authUserId: identity.authUserId });
    expect(repo.create).not.toHaveBeenCalled();
    expect(result.customerId).toBe("1");
  });

  it("creates a new CUSTOMER when no account exists for the identity", async () => {
    repo.findByAuthUserId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockImplementation((customer) => Promise.resolve(customer));

    const result = await provisionCustomer(identity);

    const [created] = repo.create.mock.calls[0];
    expect(created.authUserId).toBe(identity.authUserId);
    expect(created.customerId).toBe(identity.authUserId);
    expect(created.email).toBe(identity.email);
    expect(created.role).toBe(CustomerRole.Customer);
    expect(result.role).toBe(CustomerRole.Customer);
  });

  it("provisions the seed admin email as an ADMINISTRATOR", async () => {
    repo.findByAuthUserId.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockImplementation((customer) => Promise.resolve(customer));

    const result = await provisionCustomer({
      authUserId: "google-admin",
      email: SEED_ADMIN_EMAIL,
    });

    expect(result.role).toBe(CustomerRole.Administrator);
  });
});
