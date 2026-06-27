import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { AUTH_BASE_URL, MONGODB_CONNECTION_URI } from "@/config/config";
import {
  getBetterAuthSecret,
  getGoogleClientId,
  getGoogleClientSecret,
} from "@/config/secrets";

// Dedicated client to the same MongoDB instance Mongoose uses. `.db()` is lazy and the driver
// connects on first operation, so this does not depend on Mongoose's connection timing. With no
// database name in the URI, both this client and Mongoose default to the "test" database.
const authDbClient = new MongoClient(MONGODB_CONNECTION_URI);

export const auth = betterAuth({
  baseURL: AUTH_BASE_URL,
  secret: getBetterAuthSecret(),
  database: mongodbAdapter(authDbClient.db()),
  socialProviders: {
    google: {
      clientId: getGoogleClientId(),
      clientSecret: getGoogleClientSecret(),
    },
  },
  // Lets headless API clients carry the session as `Authorization: Bearer <token>` instead of a cookie.
  plugins: [bearer()],
});
