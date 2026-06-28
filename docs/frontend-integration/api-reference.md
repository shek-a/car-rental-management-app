# GraphQL API Reference

Single endpoint: **`POST http://localhost:8082/graphQL`**. Send `{ "query": "...", "variables": {...} }`
with `Content-Type: application/json`. Add `Authorization: Bearer <token>` for protected operations
(see [authorization.md](./authorization.md)).

The authoritative schema is [`schema.graphql`](./schema.graphql) — use it for codegen.

---

## Queries

All queries are **public** (no token required).

### `cars: [Car!]!`
All cars in the fleet.

```graphql
query {
  cars { carId make model type costPerDay photo { url contentType } }
}
```

### `car(carId: ID!): Car`
A single car by id (nullable — `null` semantics depend on the resolver; a missing car surfaces an error).

```graphql
query ($carId: ID!) {
  car(carId: $carId) {
    carId make model type costPerDay leasedDate returnDate
    photo { url contentType }
    customer { customerId firstName }
  }
}
```

### `customers: [Customer!]!`
All customers. (Returns personal data — see the privacy note in [authorization.md](./authorization.md).)

### `customer(customerId: ID!): Customer`
A single customer by id, including the cars they currently hold.

```graphql
query ($customerId: ID!) {
  customer(customerId: $customerId) {
    customerId firstName lastName email age role
    cars { carId make model }
  }
}
```

---

## Mutations

Auth column: **Public** / **Admin** (administrator only) / **Own** (signed-in customer acting on
their own `customerId`). See [authorization.md](./authorization.md) for exact rules.

| Mutation | Args | Returns | Auth |
|----------|------|---------|------|
| `createCustomer` | `input: CreateCustomerInput!` | `Customer` | Public |
| `updateCustomer` | `customerId: ID!, input: UpdateCustomerInput!` | `Customer` | ⚠️ Unprotected |
| `deleteCustomer` | `customerId: ID!` | `Customer` | ⚠️ Unprotected |
| `createCar` | `input: CreateCarInput!` | `Car` | Admin |
| `updateCar` | `carId: ID!, input: UpdateCarInput!` | `Car` | ⚠️ Unprotected |
| `deleteCar` | `carId: ID!` | `Car` | Admin |
| `addCarToCustomer` | `carId: ID!, customerId: ID!` | `Customer` | Own |
| `removeCarFromCustomer` | `carId: ID!, customerId: ID!` | `Customer` | Own |
| `grantAdministratorRole` | `customerId: ID!` | `Customer` | Admin |
| `addCarPhoto` | `carId: ID!, input: AddCarPhotoInput!` | `Car` | Admin |
| `removeCarPhoto` | `carId: ID!` | `Car` | Admin |

### Rent a car — `addCarToCustomer` (Own account)

```graphql
mutation ($carId: ID!, $customerId: ID!) {
  addCarToCustomer(carId: $carId, customerId: $customerId) {
    customerId
    cars { carId make model }
  }
}
```
`customerId` must be the signed-in customer's own id, else a forbidden error. Errors if the car is
already leased or does not exist.

### Return a car — `removeCarFromCustomer` (Own account)
Same shape as renting; removes the car from the customer's set.

### Create a car — `createCar` (Admin)

```graphql
mutation ($input: CreateCarInput!) {
  createCar(input: $input) { carId make model type costPerDay }
}
```
```json
{ "input": { "carId": "5", "make": "Tesla", "model": "Model 3", "type": "SEDAN", "costPerDay": 90.0 } }
```

### Delete a car — `deleteCar` (Admin)
Removes the car and its photo. `mutation ($carId: ID!) { deleteCar(carId: $carId) { carId } }`

### Grant administrator — `grantAdministratorRole` (Admin)

```graphql
mutation ($customerId: ID!) {
  grantAdministratorRole(customerId: $customerId) { customerId role }
}
```

### Photos — `addCarPhoto` / `removeCarPhoto` (Admin)
See **[photos.md](./photos.md)**.

### Customer mutations
- `createCustomer(input: CreateCustomerInput!)` — public. Note: normal users are provisioned
  automatically on first Google sign-in, so you rarely need this from a client.
- `updateCustomer` / `deleteCustomer` — ⚠️ unprotected; gate in your UI (see authorization).

---

## Object types

### `Customer`
| Field | Type | Notes |
|-------|------|-------|
| `customerId` | `ID!` | Identity |
| `firstName` | `String` | Nullable (may be unset for Google sign-ups) |
| `lastName` | `String` | Nullable |
| `email` | `String!` | Verified email |
| `age` | `Int` | Nullable |
| `role` | `CustomerRole!` | `CUSTOMER` or `ADMINISTRATOR` |
| `cars` | `[Car!]` | Cars the customer currently holds (resolved on demand) |

### `Car`
| Field | Type | Notes |
|-------|------|-------|
| `carId` | `ID!` | Identity |
| `make` | `String!` | |
| `model` | `String!` | |
| `type` | `CarType!` | enum |
| `costPerDay` | `Float!` | |
| `leasedDate` | `Date` | Nullable |
| `returnDate` | `Date` | Nullable |
| `customer` | `Customer` | The renter, or `null` if available (resolved on demand) |
| `photo` | `CarPhoto` | `null` when the car has no photo (resolved on demand) |

### `CarPhoto`
| Field | Type | Notes |
|-------|------|-------|
| `url` | `String!` | Public URL to fetch the image bytes (`GET /photos/:carId`) |
| `contentType` | `String!` | e.g. `image/jpeg` |

---

## Enums

```graphql
enum CustomerRole { CUSTOMER ADMINISTRATOR }
enum CarType { CONVERTABLE COUPE HATCH SEDAN SUV }
```

> Note: the fleet enum value is spelled `CONVERTABLE` (as in the schema).

---

## Input types

### `CreateCustomerInput`
`customerId: String!`, `firstName: String!`, `lastName: String!`, `email: String!`, `age: Int!` — all required.

### `UpdateCustomerInput`
`firstName: String`, `lastName: String`, `email: String`, `age: Int` — all optional (partial update).

### `CreateCarInput`
`carId: ID!`, `make: String!`, `model: String!`, `type: CarType!`, `costPerDay: Float!` — all required.

### `UpdateCarInput`
`make: String`, `model: String`, `type: CarType`, `costPerDay: Float`, `leasedDate: Date`,
`returnDate: Date` — all optional.

### `AddCarPhotoInput`
`data: String!` (base64-encoded image), `contentType: String!` — see [photos.md](./photos.md).

---

## The `Date` scalar

`Date` is a custom scalar with no special coercion (passthrough). In **responses**, date fields
(`leasedDate`, `returnDate`) come back as **ISO 8601 strings** (e.g. `"2026-06-28T00:00:00.000Z"`)
because the underlying value is a JS `Date` serialized to JSON. When **sending** a date (e.g. in
`UpdateCarInput`), provide an ISO 8601 string. Parse/format on the client with your date library of
choice.

---

## A note on nullability

Several fields are nullable (`firstName`, `age`, `leasedDate`, `Car.customer`, `Car.photo`, …).
Always null-check in your UI. List queries (`cars`, `customers`) return non-null lists of non-null
items, but the singular `car`/`customer` queries and many mutation return types are nullable.
