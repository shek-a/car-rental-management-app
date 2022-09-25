import { gql } from "apollo-server-express";

export const typeDefs = gql`
  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
    customer(customerId: ID!): Customer
    customers: [Customer!]!
  }

  type Mutation {
    createCustomer(input: CreateCustomerInput!): Customer
    updateCustomer(customerId: ID!, input: UpdateCustomerInput!): Customer
    deleteCustomer(customerId: ID!): Customer
  }

  type Customer {
    customerId: ID!
    firstName: String!
    lastName: String!
    email: String!
    age: Int!
  }

  input CreateCustomerInput {
    firstName: String!
    lastName: String!
    email: String!
    age: Int!
    customerId: String!
  }

  input UpdateCustomerInput {
    firstName: String
    lastName: String
    email: String
    age: Int
  }
`;
