import { CustomerRole } from "@/generated/types";

// Role is a value object on the Customer aggregate. Its values are intentionally identical to the
// GraphQL CustomerRole enum so a persisted role round-trips through the API unchanged. Role-related
// business rules live here (in the domain), never in resolvers.

export const DEFAULT_ROLE: CustomerRole = CustomerRole.Customer;

export const isAdministrator = (role: CustomerRole): boolean =>
  role === CustomerRole.Administrator;

export const roleForNewCustomer = (
  email: string,
  seedAdminEmail: string
): CustomerRole =>
  email.toLowerCase() === seedAdminEmail.toLowerCase()
    ? CustomerRole.Administrator
    : CustomerRole.Customer;
