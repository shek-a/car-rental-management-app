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
    searchAvailableCars(
      location: String!
      requestedPeriod: RentalPeriodInput!
    ): [Car!]!
  }

  type Mutation {
    createCustomer(input: CreateCustomerInput!): Customer
    updateCustomer(customerId: ID!, input: UpdateCustomerInput!): Customer
    deleteCustomer(customerId: ID!): Customer
    createCar(input: CreateCarInput!): Car
    updateCar(carId: ID!, input: UpdateCarInput!): Car
    deleteCar(carId: ID!): Car
    addCarToCustomer(carId: ID!, customerId: ID!, dueBackDate: Date!): Customer
    removeCarFromCustomer(carId: ID!, customerId: ID!): Customer
    grantAdministratorRole(customerId: ID!): Customer
    addCarPhoto(carId: ID!, input: AddCarPhotoInput!): Car
    removeCarPhoto(carId: ID!): Car
  }

  type CarPhoto {
    url: String!
    contentType: String!
  }

  input AddCarPhotoInput {
    data: String!
    contentType: String!
  }

  enum CustomerRole {
    CUSTOMER
    ADMINISTRATOR
  }

  type Customer {
    customerId: ID!
    firstName: String
    lastName: String
    email: String!
    age: Int
    role: CustomerRole!
    cars: [Car!]
  }

  enum FleetStatus {
    AVAILABLE
    LEASED
    DUE_SOON
    OVERDUE
  }

  type RentalPeriod {
    leaseDate: Date!
    dueBackDate: Date!
  }

  input RentalPeriodInput {
    leaseDate: Date!
    dueBackDate: Date!
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
    photo: CarPhoto
    plate: String
    year: Int
    seats: Int
    transmission: String
    fuel: String
    colour: String
    location: String
    rentalPeriod: RentalPeriod
    status: FleetStatus!
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
    plate: String
    year: Int
    seats: Int
    transmission: String
    fuel: String
    colour: String
    location: String
  }

  input UpdateCarInput {
    make: String
    model: String
    type: CarType
    costPerDay: Float
    leasedDate: Date
    returnDate: Date
    plate: String
    year: Int
    seats: Int
    transmission: String
    fuel: String
    colour: String
    location: String
  }
`;
