export const GRAPHQL_PATH = '/graphQL';
export const PORT = '8082';
// MongoDB connection string. Defaults to the local Docker instance so local dev needs no .env;
// production URIs may embed credentials, so overrides belong in the git-ignored .env.
export const MONGODB_CONNECTION_URI =
  process.env['MONGODB_CONNECTION_URI'] ?? 'mongodb://localhost:27017';
export const CUSTOMER_MONGO_DB_COLLECTION = 'Customer';
export const CAR_MONGO_DB_COLLECTION = 'Car';

// Authentication (non-secret config only — secrets live in src/config/secrets.ts)
export const AUTH_PATH = '/api/auth';
// Public base address of the API. Configurable per environment (env override), defaulting to local
// dev so no .env is needed. Used for photo URLs and the sign-in flow.
export const AUTH_BASE_URL = process.env['AUTH_BASE_URL'] ?? 'http://localhost:8082';
// Google email provisioned as the first ADMINISTRATOR on sign-in (bootstraps admin access — every
// other account starts as CUSTOMER and can only be promoted by an existing admin). Not a secret,
// but deployment-specific, so it is env-configurable like AUTH_BASE_URL; the default is a
// placeholder that matches no real account.
export const SEED_ADMIN_EMAIL =
  process.env['SEED_ADMIN_EMAIL'] ?? 'admin@example.com';

// Browser origins allowed to call the API (CORS + Better Auth trustedOrigins). Comma-separated env
// override; the defaults cover the local web app + the API itself.
export const ALLOWED_ORIGINS = (
  process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000,http://localhost:8082'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

// Car photo storage (all non-secret — local storage needs no credentials)
export const PHOTO_PATH = '/photos';
export const PHOTO_STORAGE_DIR = './.photo-storage';
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;