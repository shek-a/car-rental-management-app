import { Customer } from "@/generated/types";
import { isAdministrator } from "@/domain/customer/role";
import { AuthenticationError, AuthorizationError } from "./errors";

// The slice of GraphQL context the authorization guards depend on. Kept here (rather than importing
// the full Better Auth-backed context) so guards stay unit-testable without the auth runtime.
export interface AuthContext {
  currentCustomer: Customer | null;
}

export const requireAuthenticatedCustomer = (context: AuthContext): Customer => {
  if (!context.currentCustomer) {
    throw new AuthenticationError();
  }
  return context.currentCustomer;
};

export const requireAdministrator = (context: AuthContext): Customer => {
  const customer = requireAuthenticatedCustomer(context);
  if (!isAdministrator(customer.role)) {
    throw new AuthorizationError("Administrator role required");
  }
  return customer;
};

export const requireOwnAccount = (
  context: AuthContext,
  customerId: string
): Customer => {
  const customer = requireAuthenticatedCustomer(context);
  if (String(customer.customerId) !== String(customerId)) {
    throw new AuthorizationError("You can only act on your own account");
  }
  return customer;
};
