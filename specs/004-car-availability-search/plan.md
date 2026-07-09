# Implementation Plan: Car Availability Search (Location + Date Range)

**Branch**: `feature/car-availability-search` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-car-availability-search/spec.md`

## Summary

Back the web app's descoped catalogue-hero search bar with a real search API. Give `Car` a
**`Location`** value object (optional, additive, free-text place name compared case-insensitively)
captured through the existing `createCar`/`updateCar` mutations. Add one public query —
**`searchAvailableCars(location, requestedPeriod)`** — where the requested period **reuses the
existing `RentalPeriod` value object** and its due-back-after-lease invariant. A new stateless
**`carAvailabilityService`** domain service asks the repository for the cars at the location
(`findByLocation`, case-insensitive collation) and keeps only those available for the whole
period: no overlap with the car's current rental (inclusive boundary days — no same-day
turnaround) and not OVERDUE (reusing `deriveFleetStatus`). Resolver stays thin: build value
objects, delegate, return. No reservations, no location directory, no new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js (babel-node)

**Primary Dependencies**: Apollo Server Express 3, Express 4, Mongoose 6, GraphQL 16, Better Auth —
**no new dependencies**. Search is pure domain functions over existing plumbing.

**Storage**: MongoDB. One additive optional `Car.location` string column; matching uses Mongo
case-insensitive collation. Availability is derived at read time, never stored. No new collections
or indexes (prototype scale; an index on `location` is a one-liner later if fleets grow).

**Testing**: Jest — TDD unit tests colocated with source (value objects, availability predicate,
domain service, thin resolver); integration via the existing Docker Compose Mongo setup for the
repository's collation query.

**Target Platform**: Headless Node service on `8082`; consumed by the Rove browser SPA (feature
003 already wired CORS).

**Project Type**: Single-project backend (GraphQL web service)

**Performance Goals**: Not a performance feature. One repository query per search plus an O(cars
at location) in-memory filter; single request/response round trip (SC-003).

**Constraints**: DDD throughout (explicitly requested); reuse `RentalPeriod`,
`deriveFleetStatus`, and `carRepository` from feature 003; additive schema only; prototype scope —
no reservations/holds, no location directory, no backfill.

**Scale/Scope**: 1 new `Car` field, 1 new value object (`Location`), 1 value-object behavior
(`periodsOverlap`), 1 domain service, 1 repository method, 1 query resolver, schema delta +
regenerated types, 2 mutation inputs extended.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. Domain-Driven Design** | PASS (emphasised — the feature was requested "using the DDD skill"). `Location` value object; requested period **reuses** the `RentalPeriod` value object and vocabulary (lease/due-back — no pickup/dropoff synonyms); `carAvailabilityService` domain service owns the availability rule; overlap is value-object behavior (`periodsOverlap`); overdue check reuses `deriveFleetStatus`; repository speaks domain language (`findByLocation`). |
| **II. Schema-First GraphQL** | PASS. `Car.location`, `RentalPeriodInput`, `searchAvailableCars` query, and input-field additions land in `typeDefs.ts` first; `yarn generate-graphql-types` immediately after; resolvers use generated types. |
| **III. Test-First (NON-NEGOTIABLE)** | PASS (planned). `Location`, `periodsOverlap`, and the availability service are written test-first with tests presented for approval before implementation; only the repository (Mongo boundary) is mocked in unit tests; repository collation match covered by a Docker Compose integration test; argument capture verifies the location passed to `findByLocation`. |
| **IV. Clean Code & TypeScript Discipline** | PASS (planned). Availability condition extracted into a named predicate (`isAvailableForPeriod`); no `any`; explicit return types on all exported functions; immutable value objects (`Object.freeze`, matching `rentalPeriod.ts`). |
| **V. Layered Architecture & Simplicity** | PASS, no deviations. resolver → `carAvailabilityService` → `carRepository` → MongoDB; config untouched; no new dependencies; location directory and reservations explicitly deferred (YAGNI). |

**Initial gate**: PASS (no deviations). **Post-design gate**: PASS — design adds only additive
schema fields and pure domain code; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-car-availability-search/
├── plan.md · spec.md · research.md · data-model.md · quickstart.md
└── contracts/
    └── graphql-schema.delta.md
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── car/
│   │   ├── location.ts                    # NEW — Location value object (trim, non-blank, case-insensitive equality)
│   │   └── location.test.ts               # NEW
│   └── rental/
│       ├── rentalPeriod.ts                # MODIFY — add periodsOverlap(a, b) value-object behavior (inclusive)
│       ├── rentalPeriod.test.ts           # MODIFY
│       ├── carAvailabilityService.ts      # NEW — searchAvailableCars(location, requestedPeriod, now); isAvailableForPeriod predicate
│       └── carAvailabilityService.test.ts # NEW — capability tests (car-availability-search rules)
├── repository/
│   ├── carRepository.ts                   # MODIFY — findByLocation(location) with case-insensitive collation
│   └── carRepository.test.ts              # MODIFY
├── resolvers/
│   ├── queries/car/
│   │   ├── searchAvailableCars.ts         # NEW — thin: value objects from args → delegate to service
│   │   ├── searchAvailableCars.test.ts    # NEW
│   │   └── index.ts                       # MODIFY — export searchAvailableCars
│   └── mutations/car/
│       ├── createCar.ts / updateCar.ts    # MODIFY — accept optional location (validated via Location VO)
│       └── *.test.ts                      # MODIFY
├── model/car.ts                           # MODIFY — add optional location: String to carSchema
├── typeDefs.ts                            # MODIFY — Car.location, RentalPeriodInput, searchAvailableCars, input fields
├── generated/types.ts                     # REGENERATE — yarn generate-graphql-types (never hand-edited)
└── resolvers.ts                           # MODIFY — register the searchAvailableCars query
```

**Structure Decision**: `Location` sits in `domain/car/` (an attribute of the car); the
availability service and the overlap behavior sit in `domain/rental/` beside `carRentalService`
and `fleetStatus`, because availability is defined entirely by rental periods and fleet status.
The resolver follows the existing `queries/car/` file-per-query pattern and is registered in
`src/resolvers.ts` per the constitution. Note: the pre-existing `cars.ts`/`car.ts` queries hit
`CarModel` directly (they predate the repository); the new query goes through `carRepository` as
the constitution requires — the legacy queries are left as-is (out of scope).

## Complexity Tracking

No constitution violations — no entries.

## Phase 0 & 1 outputs

- **Phase 0** → [research.md](./research.md): 9 decisions (Location value object; contract reuses
  rental vocabulary; availability = no overlap + not overdue, derived; domain service placement;
  repository/domain split of the filtering; advisory availability with no reservations; location
  capture on existing mutations; public access; location directory deferred).
- **Phase 1** → [data-model.md](./data-model.md), [contracts/graphql-schema.delta.md](./contracts/graphql-schema.delta.md),
  [quickstart.md](./quickstart.md), and the agent-context update (CLAUDE.md plan pointer).

## Next step

Run `/speckit-tasks` to generate the dependency-ordered, TDD-first `tasks.md`.
