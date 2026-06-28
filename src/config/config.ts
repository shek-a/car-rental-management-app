export const GRAPHQL_PATH = '/graphQL';
export const PORT = '8082';
export const MONGODB_CONNECTION_URI = 'mongodb://localhost:27017';
export const CUSTOMER_MONGO_DB_COLLECTION = 'Customer';
export const CAR_MONGO_DB_COLLECTION = 'Car';

// Authentication (non-secret config only — secrets live in src/config/secrets.ts)
export const AUTH_PATH = '/api/auth';
export const AUTH_BASE_URL = 'http://localhost:8082';
export const SEED_ADMIN_EMAIL = 'andrew.shek23@gmail.com';

// Car photo storage (all non-secret — local storage needs no credentials)
export const PHOTO_PATH = '/photos';
export const PHOTO_STORAGE_DIR = './.photo-storage';
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;