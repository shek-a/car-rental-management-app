import { Customer, MutationGrantAdministratorRoleArgs } from "@/generated/types";
import { AuthContext, requireAdministrator } from "@/auth/authorization";
import { grantAdministratorRole as grantAdministratorRoleToCustomer } from "@/domain/customer/grantAdministratorRole";

export const grantAdministratorRole = async (
  _: unknown,
  { customerId }: MutationGrantAdministratorRoleArgs,
  context: AuthContext
): Promise<Customer> => {
  // Only an existing administrator may grant the administrator role (FR-008).
  requireAdministrator(context);
  return grantAdministratorRoleToCustomer(customerId);
};
