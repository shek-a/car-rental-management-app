import { grantAdministratorRole } from "./grantAdministratorRole";
import * as grantAdministratorRoleService from "@/domain/customer/grantAdministratorRole";
import { createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

jest.mock("@/domain/customer/grantAdministratorRole");

const service = grantAdministratorRoleService as jest.Mocked<
  typeof grantAdministratorRoleService
>;

describe("grantAdministratorRole resolver", () => {
  beforeEach(() => jest.resetAllMocks());

  it("rejects an unauthenticated request", async () => {
    await expect(
      grantAdministratorRole({}, { customerId: "1" }, { currentCustomer: null })
    ).rejects.toThrow(AuthenticationError);
    expect(service.grantAdministratorRole).not.toHaveBeenCalled();
  });

  it("rejects a non-administrator", async () => {
    await expect(
      grantAdministratorRole(
        {},
        { customerId: "1" },
        { currentCustomer: createNewCustomer("9") }
      )
    ).rejects.toThrow(AuthorizationError);
    expect(service.grantAdministratorRole).not.toHaveBeenCalled();
  });

  it("delegates to the domain service for an administrator", async () => {
    service.grantAdministratorRole.mockResolvedValue(createAdministrator("1"));

    const result = await grantAdministratorRole(
      {},
      { customerId: "1" },
      { currentCustomer: createAdministrator("admin") }
    );

    expect(service.grantAdministratorRole).toHaveBeenCalledWith("1");
    expect(result?.role).toBe(createAdministrator("1").role);
  });
});
