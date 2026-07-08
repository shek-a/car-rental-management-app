// Must be the first import: modules below read secrets from process.env at load time.
import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { apolloServer } from "./apolloServer";
import { auth } from "./auth/auth";
import { carPhotoRouteHandler } from "./http/carPhotoRoute";
import {
  ALLOWED_ORIGINS,
  AUTH_PATH,
  GRAPHQL_PATH,
  MONGODB_CONNECTION_URI,
  PHOTO_PATH,
  PORT,
} from "./config/config";
import { connectToMongoDb } from "./mongodb";

const app = express();

// Allow a browser web app on an allowed origin (different from the API) to call every route below.
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Better Auth must see the raw request body, so it is mounted BEFORE express.json().
app.all(`${AUTH_PATH}/*`, toNodeHandler(auth));
app.use(express.json());

// Public route serving car photo bytes.
app.get(`${PHOTO_PATH}/:carId`, carPhotoRouteHandler);

apolloServer.start().then(() => {
  apolloServer.applyMiddleware({
    app,
    path: GRAPHQL_PATH,
    // CORS is handled globally by the cors middleware above.
    cors: false,
  });
});

app.listen(
  {
    port: PORT,
  },
  () => {
    console.log(
      `GraphQL is now running on http://localhost:${PORT}${GRAPHQL_PATH}`
    );
  }
);

connectToMongoDb(MONGODB_CONNECTION_URI);
