# GraphQL Schema Delta

**Feature**: `003-fleet-details-and-rentals`

Changes to `src/typeDefs.ts`. Run `yarn generate-graphql-types` after editing. Authorization is
enforced in resolvers (reusing feature 001's guards), not in the schema.

## Added — enum & types

```graphql
enum FleetStatus {
  AVAILABLE
  LEASED
  DUE_SOON
  OVERDUE
}

"The period a car is currently rented for. Present only while the car is rented."
type RentalPeriod {
  leaseDate: Date!
  dueBackDate: Date!
}
```

## Changed — Car type

```graphql
type Car {
  carId: ID!
  make: String!
  model: String!
  type: CarType!
  costPerDay: Float!
  leasedDate: Date          # retained (raw storage backing rentalPeriod)
  returnDate: Date          # retained
  customer: Customer
  photo: CarPhoto
  plate: String             # NEW
  year: Int                 # NEW
  seats: Int                # NEW
  transmission: String      # NEW
  fuel: String              # NEW
  colour: String            # NEW
  rentalPeriod: RentalPeriod  # NEW — null when the car is available
  status: FleetStatus!        # NEW — derived at read time (never stored)
}
```

## Changed — inputs (admin car detail fields)

```graphql
input CreateCarInput {
  carId: ID!
  make: String!
  model: String!
  type: CarType!
  costPerDay: Float!
  plate: String       # NEW (optional)
  year: Int           # NEW
  seats: Int          # NEW
  transmission: String # NEW
  fuel: String        # NEW
  colour: String      # NEW
}

input UpdateCarInput {
  make: String
  model: String
  type: CarType
  costPerDay: Float
  leasedDate: Date
  returnDate: Date
  plate: String       # NEW
  year: Int           # NEW
  seats: Int          # NEW
  transmission: String # NEW
  fuel: String        # NEW
  colour: String      # NEW
}
```

## Changed — rent mutation (add due-back date)

```graphql
extend type Mutation {
  "Rent a car to a customer for a period. Caller must be the customer (own account)."
  addCarToCustomer(carId: ID!, customerId: ID!, dueBackDate: Date!): Customer   # dueBackDate is NEW
  # removeCarFromCustomer(carId, customerId) — unchanged signature
}
```

## Authorization & rules (resolver-enforced, reused from feature 001)

| Operation | Rule |
|-----------|------|
| `cars`, `car` (incl. `status`, `rentalPeriod`, detail fields) | Public |
| `addCarToCustomer` (rent) | Own account; car must be `AVAILABLE`; `dueBackDate` must be in the future |
| `removeCarFromCustomer` (return) | Own account; customer must currently hold the car |
| `createCar` / `updateCar` / `deleteCar` (detail fields) | Administrator only |

## Error semantics (unchanged categories)

| Condition | Error |
|-----------|-------|
| Not signed in on a protected op | `AuthenticationError` (unauthorized) |
| Wrong account / not admin | `AuthorizationError` (forbidden) |
| Car already leased / not held / `dueBackDate` not in the future | validation `Error` with a clear message |
