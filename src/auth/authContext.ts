import { fromNodeHeaders } from "better-auth/node";
import { IncomingHttpHeaders } from "http";
import { auth } from "./auth";
import { AuthContext } from "./authorization";
import { provisionCustomer } from "@/domain/customer/customerProvisioningService";

interface ContextInput {
  req: { headers: IncomingHttpHeaders };
}

const splitName = (
  name: string | null | undefined
): { firstName: string | null; lastName: string | null } => {
  if (!name) {
    return { firstName: null, lastName: null };
  }
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return {
    firstName: firstName ?? null,
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };
};

// Builds the GraphQL context for each request: validate the session, then resolve (provisioning
// on first sign-in) the domain Customer. The role is read fresh every request, so privilege
// changes take effect immediately (FR-011).
export const buildAuthContext = async ({
  req,
}: ContextInput): Promise<AuthContext> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return { currentCustomer: null };
  }

  const { firstName, lastName } = splitName(session.user.name);
  const currentCustomer = await provisionCustomer({
    authUserId: session.user.id,
    email: session.user.email,
    firstName,
    lastName,
  });

  return { currentCustomer };
};
