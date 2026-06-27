// Sensitive credentials are read from environment variables — never hardcoded or committed.
// The constitution otherwise hardcodes config in config.ts, but OAuth client secrets and the
// auth signing secret are credentials; see plan.md Complexity Tracking for the justification.

const requireSecret = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required secret '${name}'. Set it as an environment variable before starting the server.`
    );
  }
  return value;
};

export const getBetterAuthSecret = (): string => requireSecret("BETTER_AUTH_SECRET");

export const getGoogleClientId = (): string => requireSecret("GOOGLE_CLIENT_ID");

export const getGoogleClientSecret = (): string => requireSecret("GOOGLE_CLIENT_SECRET");
