import express from "express";
import { apolloServer } from "./apolloServer";
import { GRAPHQL_PATH, MONGODB_CONNECTION_URI, PORT } from "./config/config";
import { connectToMongoDb } from "./mongoose";

const app = express();

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
