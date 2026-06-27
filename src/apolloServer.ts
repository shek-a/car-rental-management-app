import { ApolloServer } from "apollo-server-express";
import { resolvers } from "./resolvers";
import { typeDefs } from "./typeDefs";
import { buildAuthContext } from "./auth/authContext";

export const apolloServer = new ApolloServer({
     typeDefs,
     resolvers,
     context: buildAuthContext,
});
