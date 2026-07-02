import { MutationAddCarToCustomerArgs, Customer } from "@/generated/types";
import { AuthContext, requireOwnAccount } from "@/auth/authorization";
import { rentCarToCustomer } from "@/domain/rental/carRentalService";

export const addCarToCustomer = async (
  _: unknown,
  { carId, customerId, dueBackDate }: MutationAddCarToCustomerArgs,
  context: AuthContext
): Promise<Customer> => {
  // Renting is restricted to the authenticated customer acting on their own account (FR-008/FR-010).
  requireOwnAccount(context, customerId);
  return rentCarToCustomer(carId, customerId, new Date(dueBackDate));
};
