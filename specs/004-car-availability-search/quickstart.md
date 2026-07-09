# Quickstart: Car Availability Search (Location + Date Range)

**Feature**: `004-car-availability-search`

Validates the feature end-to-end against the scenarios in [spec.md](./spec.md), using the contract
in [contracts/graphql-schema.delta.md](./contracts/graphql-schema.delta.md) and the rules in
[data-model.md](./data-model.md).

## Prerequisites

- Node.js + Yarn, Docker (per CLAUDE.md)
- MongoDB running: `docker run -d -p 27017:27017 --name car-rental-magement-app mongo`
- Dependencies installed (`yarn`) and types regenerated after the schema change
  (`yarn generate-graphql-types`)
- Server running: `yarn start` → GraphQL at `http://localhost:8082/graphQL`

## 1. Unit + integration tests (primary validation)

```bash
yarn test -- --testPathPattern src/domain/car/location
yarn test -- --testPathPattern src/domain/rental          # periodsOverlap + availability service
yarn test -- --testPathPattern src/resolvers/queries/car  # thin resolver
yarn test                                                  # full suite stays green
yarn test:integration                                      # repository collation match (Docker Compose)
```

Expected: all green; the availability tests cover FR-004/005/006 (free car, overlap incl.
boundary day, overdue exclusion) and FR-007 (invalid period rejected).

## 2. Seed a scenario fleet

Search is public, but car creation is admin-guarded — seed directly in Mongo to keep this guide
session-free (mongoose stores the `Car` model in the `cars` collection of the default `test` db):

```bash
docker exec -i car-rental-magement-app mongosh test --eval '
db.cars.insertMany([
  { carId: "QS-FREE",    make: "Toyota", model: "Corolla", type: "SEDAN", costPerDay: 60,  location: "Melbourne" },
  { carId: "QS-RENTED",  make: "Mazda",  model: "CX-5",    type: "SUV",   costPerDay: 90,  location: "Melbourne",
    leasedDate: new Date("2026-07-10"), returnDate: new Date("2026-07-20") },
  { carId: "QS-OVERDUE", make: "BMW",    model: "M3",      type: "COUPE", costPerDay: 150, location: "Melbourne",
    leasedDate: new Date("2026-06-01"), returnDate: new Date("2026-06-20") },
  { carId: "QS-SYDNEY",  make: "Kia",    model: "Rio",     type: "HATCH", costPerDay: 45,  location: "Sydney" },
  { carId: "QS-NOWHERE", make: "Ford",   model: "Focus",   type: "HATCH", costPerDay: 50 }
])'
```

## 3. Search scenarios (against the running server)

Helper:

```bash
search() { curl -s http://localhost:8082/graphQL -H 'content-type: application/json' -d "$1"; }
```

**a. Overlapping period — only the free car returns** (US1 scenarios 1–2, FR-005/006):

```bash
search '{"query":"query($l:String!,$p:RentalPeriodInput!){searchAvailableCars(location:$l,requestedPeriod:$p){carId}}",
"variables":{"l":"Melbourne","p":{"leaseDate":"2026-07-15","dueBackDate":"2026-07-18"}}}'
```

Expected: exactly `QS-FREE` (QS-RENTED overlaps; QS-OVERDUE is overdue; QS-SYDNEY wrong
location; QS-NOWHERE has no location).

**b. Period after the rental ends — rented car reappears, overdue still excluded** (US1 scenario 3):

Same query with `{"leaseDate":"2026-07-25","dueBackDate":"2026-07-28"}` →
expected: `QS-FREE` and `QS-RENTED`, not `QS-OVERDUE`.

**c. Boundary day is a conflict** (edge case — no same-day turnaround):

`{"leaseDate":"2026-07-20","dueBackDate":"2026-07-22"}` (pickup on QS-RENTED's due-back day) →
expected: `QS-RENTED` still excluded.

**d. Case/whitespace-insensitive location** (US2 scenario 4, FR-002):

`"l":" melbourne "` with period (b) → same results as (b).

**e. No match is an empty list, not an error** (FR-010):

`"l":"Perth"` → `{"data":{"searchAvailableCars":[]}}`.

**f. Invalid period rejected** (US3, FR-007):

`{"leaseDate":"2026-07-18","dueBackDate":"2026-07-15"}` → GraphQL `errors` explaining the
due-back date must be after the lease date; no `data.searchAvailableCars`.

## 4. Location capture through the API (US2)

As an admin session (see feature 001's quickstart for sign-in), run the `updateCar` example from
the [contract](./contracts/graphql-schema.delta.md) to move `QS-FREE` to `"Sydney"`, then re-run
search (a): expected — `QS-FREE` no longer in Melbourne results, present in Sydney results.

## 5. Web app smoke check (SC-002)

From the Rove web app, wire the hero bar to `searchAvailableCars` (location → `location`, date
range → `requestedPeriod.leaseDate`/`dueBackDate`) and confirm the returned cars render in the
existing CarCard grid with photo, price, and status — one request, no extra calls.

Integration note: results are **advisory**. A currently-rented car returned for a future period
(scenario b's `QS-RENTED`) cannot be booked until it is physically returned, since renting is
immediate-only — the grid should consult each car's `status` before offering the booking action.

## Cleanup

```bash
docker exec -i car-rental-magement-app mongosh test --eval 'db.cars.deleteMany({carId: {$regex: "^QS-"}})'
```
