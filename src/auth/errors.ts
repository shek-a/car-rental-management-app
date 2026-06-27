// Distinct error types so the API can tell "not signed in" (unauthorized) apart from
// "signed in but not allowed" (forbidden) — see FR-006 / FR-012.

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "You are not authorized to perform this action") {
    super(message);
    this.name = "AuthorizationError";
    Error.captureStackTrace(this, this.constructor);
  }
}
