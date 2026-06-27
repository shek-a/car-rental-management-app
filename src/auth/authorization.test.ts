import {
  requireAuthenticatedCustomer,
  requireAdministrator,
  requireOwnAccount,
} from "./authorization";
import { AuthenticationError, AuthorizationError } from "./errors";
import { createNewCustomer, createAdministrator } from "@/testing/utilities";

describe("authorization guards", () => {
  describe("requireAuthenticatedCustomer", () => {
    it("throws AuthenticationError when no customer is on the context", () => {
      expect(() => requireAuthenticatedCustomer({ currentCustomer: null })).toThrow(
        AuthenticationError
      );
    });

    it("returns the customer when one is present", () => {
      const customer = createNewCustomer("1");
      expect(requireAuthenticatedCustomer({ currentCustomer: customer })).toBe(
        customer
      );
    });
  });

  describe("requireAdministrator", () => {
    it("throws AuthenticationError when not signed in", () => {
      expect(() => requireAdministrator({ currentCustomer: null })).toThrow(
        AuthenticationError
      );
    });

    it("throws AuthorizationError when the customer is not an administrator", () => {
      expect(() =>
        requireAdministrator({ currentCustomer: createNewCustomer("1") })
      ).toThrow(AuthorizationError);
    });

    it("returns the administrator when the customer has the administrator role", () => {
      const admin = createAdministrator("1");
      expect(requireAdministrator({ currentCustomer: admin })).toBe(admin);
    });
  });

  describe("requireOwnAccount", () => {
    it("throws AuthenticationError when not signed in", () => {
      expect(() => requireOwnAccount({ currentCustomer: null }, "1")).toThrow(
        AuthenticationError
      );
    });

    it("throws AuthorizationError when acting on another customer's account", () => {
      expect(() =>
        requireOwnAccount({ currentCustomer: createNewCustomer("1") }, "2")
      ).toThrow(AuthorizationError);
    });

    it("returns the customer when acting on their own account", () => {
      const customer = createNewCustomer("1");
      expect(requireOwnAccount({ currentCustomer: customer }, "1")).toBe(customer);
    });
  });
});
