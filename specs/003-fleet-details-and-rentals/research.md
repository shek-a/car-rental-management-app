# Research: Fleet Details & Rental Flow (Prototype)

**Feature**: `003-fleet-details-and-rentals` | **Date**: 2026-07-01

Resolves the design unknowns. The guiding constraints: **Domain-Driven Design throughout**, **reuse**
the existing rent/return own-account guards and the `Car` model's existing `leasedDate`/`returnDate`
fields, and keep the scope to a **prototype demo** (no payments, no reports, no past-rental history).

## Decision 1 — `RentalPeriod` value object (reusing existing date fields)

- **Decision**: Model a **`RentalPeriod`** value object — immutable `{ leaseDate, dueBackDate }` — that
  a `Car` carries while it is rented and lacks while available. Persist it using the **existing**
  `Car.leasedDate` (→ `leaseDate`) and `Car.returnDate` (→ `dueBackDate`) fields; no new storage.
- **Rationale**: DDD value object (identity-less, equality by value, immutable). The `Car` schema
  already has these two unused date fields, so this is pure reuse. "RentalPeriod present ⟺ car is
  rented" gives a single, cohesive concept instead of two loose date columns.
- **Alternatives considered**: A separate `Rental` entity with its own id/history (rejected — that is
  the larger booking subsystem, explicitly out of scope); leaving the dates as bare fields (rejected —
  no ubiquitous language, invariants scattered).

## Decision 2 — `FleetStatus` as a derived value object

- **Decision**: `FleetStatus` is one of `AVAILABLE | LEASED | DUE_SOON | OVERDUE`, **derived at read
  time** by a pure domain function `deriveFleetStatus(rentalPeriod | null, now)`; never stored. Rules:
  no period → `AVAILABLE`; `dueBackDate` > now + 2 days → `LEASED`; within the next 2 days →
  `DUE_SOON`; in the past → `OVERDUE`. The 2-day window is a named domain constant
  (`DUE_SOON_WINDOW_DAYS`).
- **Rationale**: Status is a function of the rental period and the current time, so storing it would
  create staleness (a car must silently become overdue). A derived value object keeps it always
  correct and trivially unit-testable by passing `now`.
- **Alternatives considered**: A stored `status` column updated by a scheduler/cron (rejected —
  needless infrastructure and a source of drift for a demo).

## Decision 3 — `CarRentalService` domain service (thin resolvers)

- **Decision**: Introduce a **`carRentalService`** domain service with
  `rentCarToCustomer(carId, customerId, dueBackDate)` and `returnCarFromCustomer(carId, customerId)`.
  Move the renting/returning business rules **out of the resolvers** and into this service. The
  resolvers keep only the existing `requireOwnAccount` guard and delegate.
- **Rationale**: Renting spans two aggregates (`Customer` and `Car`) and enforces invariants (car
  available, due date in the future, customer doesn't already hold the car), which is exactly when DDD
  calls for a Domain Service. It also fixes the current constitution violation where
  `addCarToCustomer`/`removeCarFromCustomer` carry business logic inline. Resolvers become thin
  delivery (guard → delegate), per the layering rule.
- **Alternatives considered**: Keeping the logic in the resolver and just adding date-setting
  (rejected — violates DDD/layering and the user's explicit "resolvers stay thin"); putting it all on
  the `Customer` entity (rejected — the `RentalPeriod` lives on the `Car`, so a service coordinating
  both aggregates reads more naturally).

## Decision 4 — Reuse the existing rent/return operations & guards

- **Decision**: Keep `addCarToCustomer` / `removeCarFromCustomer` and their `requireOwnAccount` guard.
  Add a **`dueBackDate: Date!`** argument to `addCarToCustomer`; `removeCarFromCustomer` keeps its
  signature. Both now delegate to `carRentalService`.
- **Rationale**: The user asked to reuse the existing guards/operations. Adding one argument is the
  smallest change that captures the rental period while preserving own-account authorization and the
  existing GraphQL contract shape.
- **Alternatives considered**: New `rentCar(carId, dueBackDate)` / `returnCar(carId)` mutations that
  infer the customer from the session (cleaner ubiquitous language, more secure-by-construction) —
  deferred to avoid changing the established contract this iteration; noted as a future refinement.

## Decision 5 — Car detail fields (additive, optional)

- **Decision**: Add to `Car`: `plate` (String), `year` (Int), `seats` (Int), `transmission` (String),
  `fuel` (String), `colour` (String). All **optional/nullable**.
- **Rationale**: FR-002 requires existing cars to remain valid, so fields are optional. Per the spec
  assumption, `transmission`/`fuel`/`colour` are stored as free strings rather than enums so the
  backend doesn't constrain the UI to a fixed option list.
- **Alternatives considered**: Modelling `Transmission`/`Fuel` as GraphQL enums / value objects
  (stronger typing, but the spec explicitly says don't constrain the UI — noted as a future option).

## Decision 6 — GraphQL exposure of period & status

- **Decision**: Add `Car.status: FleetStatus!` (derived via a field resolver) and enum
  `FleetStatus { AVAILABLE LEASED DUE_SOON OVERDUE }`. Add `Car.rentalPeriod: RentalPeriod` (nullable)
  with `RentalPeriod { leaseDate: Date!, dueBackDate: Date! }`, projected from the persisted
  `leasedDate`/`returnDate`. Keep `leasedDate`/`returnDate` fields for backward compatibility with the
  already-published frontend docs.
- **Rationale**: `status` and `rentalPeriod` are the domain-aligned fields the UI needs (badges,
  filters, "due back" dates). Projecting `rentalPeriod` from the existing dates avoids duplicate
  storage; keeping the raw dates avoids breaking existing consumers.
- **Alternatives considered**: Removing `leasedDate`/`returnDate` in favour of `rentalPeriod` only
  (rejected for now — would break the published API reference; can be a later cleanup).

## Decision 7 — Cross-origin access (CORS + `trustedOrigins`)

- **Decision**: Add the `cors` middleware, mounted **before** the auth/GraphQL/photo routes, with
  `origin` set to a configured **allowed-origins** list and `credentials: true`. Add
  **`trustedOrigins`** (the same list) to the Better Auth config. (Per the Better Auth Express
  integration guide.)
- **Rationale**: Apollo enables CORS only on `/graphQL`; the `/api/auth/*` and `/photos/*` routes and
  Better Auth's own origin allow-list are not configured. A single `cors` middleware plus
  `trustedOrigins` lets a browser SPA on another origin call all three surfaces (and use cookies if it
  chooses).
- **Alternatives considered**: Hand-setting CORS headers per route (more error-prone); wildcard
  `origin: "*"` (rejected — incompatible with `credentials: true` and unsafe).

## Decision 8 — Configurable base URL & allowed origins

- **Decision**: Read `AUTH_BASE_URL` and the **allowed origins** from the environment, each with a
  **localhost default** (`http://localhost:8082` and the dev web origin), so local dev needs no `.env`
  but a deployment can point them at real addresses. Photo URLs and the sign-in flow already build
  from `AUTH_BASE_URL`, so they become environment-correct automatically.
- **Rationale**: FR-013 requires a configurable public address. This mirrors feature 001's established
  pattern of reading deployment/secret values from the environment while keeping working localhost
  defaults, so the constitution's "runs locally without a `.env`" property still holds.
- **Constitution note**: The constitution says config is hardcoded in `config.ts`. Reading base URL +
  origins from env is a small, justified extension of feature 001's env approach (recorded in the
  plan's Complexity Tracking); non-secret defaults remain in `config.ts`.

## Decision 9 — Domain events modelled, not built

- **Decision**: Name the meaningful domain occurrences — `CustomerRentedCar`, `CustomerReturnedCar` —
  in the model/ubiquitous language, but **do not** build an event-dispatch system this iteration.
- **Rationale**: DDD encourages modelling events, but there are no handlers/reactions needed for the
  demo (no notifications, no history). Building an event bus now would be speculative (YAGNI). The
  service performs the state change directly; events can be introduced when a handler needs them.

## Summary of new/changed dependencies

| Need | Choice |
|------|--------|
| Cross-origin requests | `cors` middleware (new dependency) + Better Auth `trustedOrigins` |
| Rental period / status | Existing `Car.leasedDate`/`returnDate` + pure domain functions (no new dependency) |
