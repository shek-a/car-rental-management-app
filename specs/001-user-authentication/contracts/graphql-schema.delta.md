# GraphQL Schema Delta

**Feature**: `001-user-authentication`

Changes to `src/typeDefs.ts`. After editing, run `yarn generate-graphql-types` (never hand-edit
`src/generated/types.ts`). Existing operations keep their signatures; authorization is enforced in
resolvers, not the schema.

## Added — enum

```graphql
enum CustomerRole {
  CUSTOMER
  ADMINISTRATOR
}
```

## Changed — Customer type

```graphql
type Customer {
  customerId: ID!
  firstName: String      # was String!  — relaxed (Google may not supply)
  lastName: String       # was String!  — relaxed
  email: String!
  age: Int               # was Int!      — relaxed (Google does not provide); FR-013
  role: CustomerRole!    # NEW
  cars: [Car!]
}
```

## Added — mutation

```graphql
extend type Mutation {
  "Grant the ADMINISTRATOR role to another customer. Caller MUST be an administrator."
  grantAdministratorRole(customerId: ID!): Customer
}
```

## Authorization applied to existing operations (resolver-enforced, schema unchanged)

| Operation | Rule |
|-----------|------|
| `cars`, `car`, `customers`, `customer` | Public (FR-016). |
| `createCar`, `deleteCar` | `ADMINISTRATOR` only → else forbidden (FR-009). Unauthenticated → unauthorized. |
| `addCarToCustomer` (rent) | Authenticated; `customerId` arg MUST equal caller's own customer → else forbidden (FR-010). |
| `removeCarFromCustomer` (return) | Authenticated; own account only → else forbidden (FR-010). |
| `grantAdministratorRole` | `ADMINISTRATOR` only (FR-008). |
| `updateCar`, `createCustomer`, `updateCustomer`, `deleteCustomer` | Out of scope for this feature's auth rules; behaviour unchanged. |

## Error semantics

| Condition | GraphQL error | Maps to |
|-----------|---------------|---------|
| No / invalid / expired session on a protected op | `AuthenticationError` (UNAUTHENTICATED) | FR-006, SC-002 |
| Authenticated but wrong role / not own account | `AuthorizationError` (FORBIDDEN) | FR-012, SC-003, SC-004 |
