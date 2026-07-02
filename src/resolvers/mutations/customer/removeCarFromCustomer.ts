import { MutationRemoveCarFromCustomerArgs, Customer } from "@/generated/types";
import { AuthContext, requireOwnAccount } from "@/auth/authorization";
import { returnCarFromCustomer } from "@/domain/rental/carRentalService";

export const removeCarFromCustomer = async (
  _: unknown,
  { carId, customerId }: MutationRemoveCarFromCustomerArgs,
  context: AuthContext
): Promise<Customer> => {
  // Returning is restricted to the authenticated customer acting on their own account (FR-010).
  requireOwnAccount(context, customerId);
  return returnCarFromCustomer(carId, customerId);
};
