import { Customer, CustomerRole } from "@/generated/types";
import * as customerRepository from "@/repository/customerRepository";

// Domain service: promote a customer to the administrator role. Authorization (only an existing
// administrator may call this) is enforced by the resolver before delegating here.
export const grantAdministratorRole = async (
  customerId: string
): Promise<Customer> => {
  const customer = await customerRepository.findByCustomerId(customerId);
  if (!customer) {
    throw new Error(`Customer id ${customerId} does not exist`);
  }

  const updated = await customerRepository.update(customerId, {
    role: CustomerRole.Administrator,
  });
  return updated ?? { ...customer, role: CustomerRole.Administrator };
};
