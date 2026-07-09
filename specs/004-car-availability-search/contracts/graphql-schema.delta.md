# GraphQL Schema Delta: Car Availability Search

**Feature**: `004-car-availability-search` | Applies to `src/typeDefs.ts`

All changes are **additive** — no existing field, argument, or type changes shape, so existing
clients (and the generated types they rely on) keep working. After applying, run
`yarn generate-graphql-types` (constitution, Principle II).

## Additions

```graphql
type Query {
  # NEW — public (no session required), like `cars`/`car`.
  # Returns only cars whose location matches (case-insensitive, trimmed) AND that are
  # available for the entire requested period. Empty list when nothing matches.
  searchAvailableCars(location: String!, requestedPeriod: RentalPeriodInput!): [Car!]!
}

# NEW — the searcher's desired period; same vocabulary and validity rule as the existing
# RentalPeriod type (due-back strictly after lease).
input RentalPeriodInput {
  leaseDate: Date!
  dueBackDate: Date!
}

type Car {
  # NEW — where the car is picked up/returned. Null on cars whose location has not
  # been recorded yet; such cars never appear in searchAvailableCars results.
  location: String
}

input CreateCarInput {
  # NEW — optional; when present must be non-blank (trimmed, stored as given).
  location: String
}

input UpdateCarInput {
  # NEW — optional; when present must be non-blank. Explicit null is rejected —
  # a location can be changed but not cleared.
  location: String
}
```

## Semantics

| Rule | Behavior |
|---|---|
| Location match | `location` argument trimmed, compared case-insensitively with `Car.location` (`" melbourne "` matches `"Melbourne"`). Cars with null `location` never match. |
| Availability | Car has no current rental → matches. Car OVERDUE (past due-back, not returned) → never matches. Otherwise matches iff its rental period does not overlap `requestedPeriod`, **boundary days inclusive at UTC calendar-day granularity** (pickup on the due-back day is a conflict regardless of time of day). |
| Empty result | `[]` with no error. |
| Result shape | Full `Car` — same fields, photo, and derived `status` as the `cars` query, so the catalogue grid renders identically. |
| Advisory results | Availability reflects **current** rentals only (no reservations exist). A rented car returned for a period after its due-back date is a valid result but cannot be booked until it is physically returned — renting is immediate-only. Frontends should consult each car's `status` before offering the booking action. |

## Validation errors

| Input | Result |
|---|---|
| `requestedPeriod.dueBackDate` ≤ `requestedPeriod.leaseDate` | GraphQL error: "A rental period's due-back date must be after its lease date" (existing `RentalPeriod` invariant); no data returned. |
| Unparseable date in `requestedPeriod` | GraphQL error (invalid rental period); no data returned. |
| Blank `location` argument, or blank `location` in create/update input | GraphQL error (a location must not be blank). |
| Explicit `location: null` in `UpdateCarInput` | GraphQL error (a car's location can be changed but not cleared); no update applied. |

## Example operations

Search the catalogue (hero bar submit):

```graphql
query SearchAvailableCars($location: String!, $requestedPeriod: RentalPeriodInput!) {
  searchAvailableCars(location: $location, requestedPeriod: $requestedPeriod) {
    carId
    make
    model
    type
    costPerDay
    location
    status
    photo { url contentType }
  }
}
```

```json
{
  "location": "Melbourne",
  "requestedPeriod": { "leaseDate": "2026-07-15", "dueBackDate": "2026-07-18" }
}
```

Record a location (admin, existing mutations):

```graphql
mutation {
  updateCar(carId: "CAR-1", input: { location: "Melbourne" }) {
    carId
    location
  }
}
```
