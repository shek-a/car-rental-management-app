# Quickstart & Validation: Fleet Details & Rental Flow

**Feature**: `003-fleet-details-and-rentals`

Proves the feature end-to-end. References [contracts/](./contracts/) and [data-model.md](./data-model.md)
rather than repeating them. Implementation belongs in `tasks.md`.

## Prerequisites

- Node.js, Yarn, Docker, MongoDB running (per project setup).
- Auth env vars from feature 001 (to get an **administrator** and a **customer** session token).
- No new services — rental period and status reuse existing car date fields.

## Setup

```bash
yarn
yarn generate-graphql-types      # after the schema delta
yarn start                       # http://localhost:8082
```

## Automated tests (primary validation)

```bash
yarn test                                            # all unit tests (TDD)
yarn test -- --testPathPattern fleetStatus           # status derivation (available/leased/due soon/overdue)
yarn test -- --testPathPattern rentalPeriod          # RentalPeriod value object + invariants
yarn test -- --testPathPattern carRentalService      # rent/return orchestration + invariants
yarn test:integration                                # rent → status → return against Docker Mongo
```

## Manual end-to-end scenarios

Obtain an admin token and a customer token (feature 001 sign-in), then:

### Scenario A — Car details (US1, US4, SC-001)
1. As admin, `createCar` with `plate`, `year`, `seats`, `transmission`, `fuel`, `colour`.
2. Query `cars { carId make plate year seats transmission fuel colour status rentalPeriod { dueBackDate } }`
   (no auth). **Expected**: all fields present; a not-rented car has `status: AVAILABLE` and
   `rentalPeriod: null`.

### Scenario B — Rent for a period → status (US2, SC-002, SC-003)
1. As the customer, `addCarToCustomer(carId, customerId, dueBackDate: <5 days out>)`.
2. **Expected**: succeeds; the car is associated with the customer, `rentalPeriod.dueBackDate` is set,
   and `status` is `LEASED`.
3. Rent another car with `dueBackDate` **1 day out** → `status: DUE_SOON`. A car whose due date has
   passed reads `OVERDUE` (seed one via admin `updateCar` returnDate in the past to demo).

### Scenario C — Authorization (US2, US4, SC-004)
1. `addCarToCustomer` with **no** token → unauthorized; with **another** customer's id → forbidden.
2. `createCar`/`updateCar`/`deleteCar` as a non-admin → forbidden; unauthenticated → unauthorized.

### Scenario D — Already leased / bad date (US2)
1. Rent an already-leased car → rejected ("already leased out").
2. Rent with a `dueBackDate` in the past → rejected.

### Scenario E — Return frees the car (US3, SC-003)
1. As the customer, `removeCarFromCustomer(carId, customerId)`.
2. **Expected**: `status` back to `AVAILABLE`, `rentalPeriod: null`, and the car no longer appears in
   the customer's `cars`.

### Scenario F — Active rentals list (US2)
1. Query the customer and their `cars { carId rentalPeriod { dueBackDate } status }`.
2. **Expected**: currently-held cars appear with their due-back dates. (No past/returned cars — history
   is out of scope.)

### Scenario G — Cross-origin + configurable base URL (US5, SC-005, SC-006)
1. From a page served on the allowed dev web origin, call `/graphQL` and load a `photo.url`.
   **Expected**: neither is blocked by the browser.
2. Start the server with `AUTH_BASE_URL` pointed at a different address; query a car's `photo.url`.
   **Expected**: the URL uses the configured address.

## Success criteria coverage

| Scenario | Covers |
|----------|--------|
| A | SC-001 |
| B | SC-002, SC-003 |
| C | SC-004 |
| D | FR-007, FR-009 |
| E | SC-003 |
| F | FR-010 |
| G | SC-005, SC-006 |
