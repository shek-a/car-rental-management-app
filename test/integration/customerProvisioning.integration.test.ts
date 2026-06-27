import mongoose from "mongoose";
import { MONGODB_CONNECTION_URI } from "@/config/config";
import { CustomerModel } from "@/model/customer";
import { provisionCustomer } from "@/domain/customer/customerProvisioningService";
import { CustomerRole } from "@/generated/types";

// Verifies the persistence boundary: provisioning writes a real Customer and is idempotent across
// repeat sign-ins (no duplicate). Business-rule edge cases are covered by the unit tests.

const identity = {
  authUserId: "google-integration-123",
  email: "integration.renter@gmail.com",
  firstName: "Ingrid",
  lastName: "Tester",
};

beforeAll(async () => {
  await mongoose.connect(MONGODB_CONNECTION_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await CustomerModel.deleteMany({ authUserId: identity.authUserId });
});

describe("customer provisioning (integration)", () => {
  it("persists a new customer on first sign-in", async () => {
    const provisioned = await provisionCustomer(identity);

    expect(provisioned.role).toBe(CustomerRole.Customer);

    const stored = await CustomerModel.find({ authUserId: identity.authUserId });
    expect(stored).toHaveLength(1);
    expect(stored[0].email).toBe(identity.email);
    expect(stored[0].authUserId).toBe(identity.authUserId);
  });

  it("reuses the same customer on repeat sign-in (no duplicate)", async () => {
    await provisionCustomer(identity);
    await provisionCustomer(identity);

    const stored = await CustomerModel.find({ authUserId: identity.authUserId });
    expect(stored).toHaveLength(1);
  });
});
