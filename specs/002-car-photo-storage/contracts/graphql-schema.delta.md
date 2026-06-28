# GraphQL Schema Delta

**Feature**: `002-car-photo-storage`

Changes to `src/typeDefs.ts`. Run `yarn generate-graphql-types` after editing (never hand-edit
`src/generated/types.ts`). Authorization is enforced in resolvers, not the schema.

## Added — types & input

```graphql
"A car's photo, as seen by clients. Bytes are served at `url`."
type CarPhoto {
  url: String!
  contentType: String!
}

"Base64-encoded image plus its declared content type. The declared type is re-verified server-side."
input AddCarPhotoInput {
  data: String!         # base64-encoded image bytes
  contentType: String!  # e.g. "image/jpeg" | "image/png" | "image/webp"
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
  leasedDate: Date
  returnDate: Date
  customer: Customer
  photo: CarPhoto        # NEW — null when the car has no photo
}
```

## Added — mutations

```graphql
extend type Mutation {
  "Add or replace a car's photo. Caller MUST be an administrator."
  addCarPhoto(carId: ID!, input: AddCarPhotoInput!): Car

  "Remove a car's photo. Caller MUST be an administrator."
  removeCarPhoto(carId: ID!): Car
}
```

## Authorization (resolver-enforced)

| Operation | Rule |
|-----------|------|
| `addCarPhoto` | `ADMINISTRATOR` only → else forbidden; unauthenticated → unauthorized (FR-002) |
| `removeCarPhoto` | `ADMINISTRATOR` only (FR-002) |
| `Car.photo` field | Public — resolves the URL/contentType for anyone (FR-006) |

## Error semantics

| Condition | Error |
|-----------|-------|
| Not signed in on a photo mutation | `AuthenticationError` (UNAUTHENTICATED) |
| Signed in but not admin | `AuthorizationError` (FORBIDDEN) |
| Car not found | `Error("Car id <id> does not exist")` |
| Unsupported format / oversize / undecodable | validation `Error` with a clear reason; nothing stored, existing photo intact (FR-011) |
