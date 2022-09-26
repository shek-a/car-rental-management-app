import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Date

  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
    customer(customerId: ID!): Customer
    customers: [Customer!]!
    car(carId: ID!): Car
    cars: [Car!]!
  }

  type Mutation {
    createCustomer(input: CreateCustomerInput!): Customer
    updateCustomer(customerId: ID!, input: UpdateCustomerInput!): Customer
    deleteCustomer(customerId: ID!): Customer
    createCar(input: CreateCarInput!): Car
    updateCar(carId: ID!, input: UpdateCarInput!): Car
    deleteCar(carId: ID!): Car
    addCarToCustomer(carId: ID!, customerId: ID!): Customer
    removeCarFromCustomer(carId: ID!, customerId: ID!): Customer
  }

  type Customer {
    customerId: ID!
    firstName: String!
    lastName: String!
    email: String!
    age: Int!
    cars: [Car!]
  }

  type Car {
    carId: ID!
    make: String!
    model: String!
    type: CarType!
    costPerDay: Float!
    leasedDate: Date
    returnDate: Date
    customer: Customer
  }

  enum CarType {
    CONVERTABLE
    COUPE
    HATCH
    SEDAN
    SUV
  }

  input CreateCustomerInput {
    customerId: String!
    firstName: String!
    lastName: String!
    email: String!
    age: Int!
  }

  input UpdateCustomerInput {
    firstName: String
    lastName: String
    email: String
    age: Int
  }

  input CreateCarInput {
    carId: ID!
    make: String!
    model: String!
    type: CarType!
    costPerDay: Float!
  }

  input UpdateCarInput {
    make: String
    model: String
    type: CarType
    costPerDay: Float
    leasedDate: Date
    returnDate: Date
  }
`;
