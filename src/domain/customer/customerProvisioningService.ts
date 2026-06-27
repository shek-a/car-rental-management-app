import { Customer } from "@/generated/types";
import { CustomerEntity } from "@/model/customer";
import { SEED_ADMIN_EMAIL } from "@/config/config";
import * as customerRepository from "@/repository/customerRepository";
import { roleForNewCustomer } from "./role";

// A verified identity from the authentication boundary (Better Auth), mapped into domain terms.
export interface AuthenticatedIdentity {
  authUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

// Resolve-or-create the domain Customer for an authenticated identity. Idempotent: repeat sign-ins
// reuse the same account (link by stable authUserId, else by verified email, else create new).
export const provisionCustomer = async (
  identity: AuthenticatedIdentity
): Promise<Customer> => {
  const existingByAuthUser = await customerRepository.findByAuthUserId(
    identity.authUserId
  );
  if (existingByAuthUser) {
    return existingByAuthUser;
  }

  const existingByEmail = await customerRepository.findByEmail(identity.email);
  if (existingByEmail) {
    const linked = await customerRepository.update(existingByEmail.customerId, {
      authUserId: identity.authUserId,
    });
    return linked ?? existingByEmail;
  }

  const newCustomer: CustomerEntity = {
    customerId: identity.authUserId,
    authUserId: identity.authUserId,
    email: identity.email,
    firstName: identity.firstName ?? null,
    lastName: identity.lastName ?? null,
    role: roleForNewCustomer(identity.email, SEED_ADMIN_EMAIL),
  };
  return customerRepository.create(newCustomer);
};
