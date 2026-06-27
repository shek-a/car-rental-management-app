import express from "express";
import { toNodeHandler } from "better-auth/node";
import { apolloServer } from "./apolloServer";
import { auth } from "./auth/auth";
import {
  AUTH_PATH,
  GRAPHQL_PATH,
  MONGODB_CONNECTION_URI,
  PORT,
} from "./config/config";
import { connectToMongoDb } from "./mongodb";

const app = express();

// Better Auth must see the raw request body, so it is mounted BEFORE express.json().
app.all(`${AUTH_PATH}/*`, toNodeHandler(auth));
app.use(express.json());

apolloServer.start().then(() => {
  apolloServer.applyMiddleware({
    app,
    path: GRAPHQL_PATH,
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
