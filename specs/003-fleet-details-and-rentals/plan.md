# Implementation Plan: Fleet Details & Rental Flow (Prototype)

**Branch**: `feature/fleet-details-and-rental-flow` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-fleet-details-and-rentals/spec.md`

## Summary

Make the backend sufficient for the Rove web-UI prototype demo. Add optional `Car` detail fields
(plate, year, seats, transmission, fuel, colour); model the current rental as a **`RentalPeriod`**
value object (reusing the `Car` model's existing `leasedDate`/`returnDate` fields) and a derived
**`FleetStatus`** value (`AVAILABLE | LEASED | DUE_SOON | OVERDUE`, 2-day due-soon window). Renting
captures a customer-provided due-back date; a **`CarRentalService`** domain service owns the
rent/return rules so the resolvers stay thin and keep their existing `requireOwnAccount` guard. Add
cross-origin access (`cors` + Better Auth `trustedOrigins`) and an environment-configurable base URL
so a browser SPA on another origin can connect. No payments, no reports, no past-rental history.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js (babel-node)

**Primary Dependencies**: Apollo Server Express 3, Express 4, Mongoose 6, GraphQL 16, Better Auth;
**adding** `cors`. Rental period/status use existing date fields + pure domain functions (no new dep).

**Storage**: MongoDB. `RentalPeriod` persists via the existing `Car.leasedDate`/`returnDate`; detail
fields are new optional `Car` columns. `FleetStatus` is derived, never stored.

**Testing**: Jest (unit, colocated, TDD); integration via Docker Compose Mongo.

**Target Platform**: Headless Node service on `8082`; consumed by a browser SPA on another origin.

**Project Type**: Single-project backend (GraphQL web service)

**Performance Goals**: Not a performance feature. Status derivation is O(1) per car at read time.

**Constraints**: DDD throughout; reuse existing rent/return guards + date fields; prototype scope
(no payments/reports/history/gallery/extra-auth/fleet-manager role).

**Scale/Scope**: 6 new `Car` fields, 2 value objects (`RentalPeriod`, `FleetStatus`), 1 domain
service, repository extension, 1 field resolver (`status`) + 1 projection (`rentalPeriod`), schema
delta, thin-resolver refactor of rent/return, and the CORS/base-URL enablers.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. Domain-Driven Design** | PASS (emphasised). `RentalPeriod` + `FleetStatus` value objects; `CarRentalService` domain service owns renting/returning; repositories hide Mongoose; resolvers become thin (guard → delegate); ubiquitous language (rent, return, due-back, fleet status). Domain events named but not built (YAGNI). |
| **II. Schema-First GraphQL** | PASS. `FleetStatus` enum, `RentalPeriod` type, `Car` fields, `dueBackDate` arg, input fields added to `typeDefs.ts`; types regenerated. |
| **III. Test-First (NON-NEGOTIABLE)** | PASS (planned). Value objects, status derivation, the domain service, and resolver guards are written test-first; mock only at boundaries (repositories). |
| **IV. Clean Code & TypeScript Discipline** | PASS (planned). `FleetStatus` as a union/enum; `RentalPeriod` immutable; `DUE_SOON_WINDOW_DAYS` named constant; explicit return types; no `any` in new code. |
| **V. Layered Architecture & Simplicity** | PASS with one justified deviation. resolver → `CarRentalService` → repository. Deviation: base URL + allowed origins read from environment (extends feature 001's env pattern; defaults keep local dev `.env`-free). |

**Initial gate**: PASS (one deviation). **Post-design gate**: PASS — design adds the `cors` dependency
and env-config only; no other deviations.

## Project Structure

### Documentation (this feature)

```text
specs/003-fleet-details-and-rentals/
├── plan.md · spec.md · research.md · data-model.md · quickstart.md
├── contracts/
│   ├── graphql-schema.delta.md
│   └── cross-origin-and-config.contract.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/
├── domain/rental/                       # NEW — rental domain
│   ├── rentalPeriod.ts                  # RentalPeriod value object (+ future-date invariant)
│   ├── rentalPeriod.test.ts
│   ├── fleetStatus.ts                   # FleetStatus + deriveFleetStatus(period, now) + DUE_SOON_WINDOW_DAYS
│   ├── fleetStatus.test.ts
│   ├── carRentalService.ts              # rentCarToCustomer / returnCarFromCustomer (domain service)
│   └── carRentalService.test.ts
├── repository/
│   ├── carRepository.ts                 # MODIFY — add setRentalPeriod / clearRentalPeriod (save Car aggregate)
│   └── carRepository.test.ts            # MODIFY
├── resolvers/
│   ├── mutations/customer/
│   │   ├── addCarToCustomer.ts          # MODIFY — thin: requireOwnAccount + delegate; accept dueBackDate
│   │   ├── addCarToCustomer.test.ts     # MODIFY
│   │   ├── removeCarFromCustomer.ts     # MODIFY — thin: delegate to service
│   │   └── removeCarFromCustomer.test.ts# MODIFY
│   ├── mutations/car/
│   │   ├── createCar.ts / updateCar.ts  # MODIFY — accept new detail fields (updateCar also gains admin guard if missing)
│   │   └── *.test.ts                    # MODIFY
│   └── car/
│       ├── fetchStatusByCar.ts          # NEW — Car.status field resolver (deriveFleetStatus(car, now))
│       ├── fetchStatusByCar.test.ts
│       ├── fetchRentalPeriodByCar.ts    # NEW — Car.rentalPeriod projection from leasedDate/returnDate
│       └── fetchRentalPeriodByCar.test.ts
├── model/car.ts                         # MODIFY — add plate, year, seats, transmission, fuel, colour
├── config/config.ts                     # MODIFY — env-backed AUTH_BASE_URL + ALLOWED_ORIGINS (defaults kept)
├── auth/auth.ts                         # MODIFY — add trustedOrigins from config
├── server.ts                            # MODIFY — mount cors() before routes
├── typeDefs.ts                          # MODIFY — FleetStatus, RentalPeriod, Car fields, inputs, dueBackDate arg
└── resolvers.ts                         # MODIFY — register Car.status + Car.rentalPeriod field resolvers
```

**Structure Decision**: New `domain/rental/` holds the value objects and the `CarRentalService`; the
existing rent/return resolvers are refactored to thin delegators (guard → service). `FleetStatus` and
`RentalPeriod` are exposed via field resolvers so status stays derived and the period projects from the
existing date fields. CORS/base-URL are wired in `server.ts`/`auth.ts`/`config.ts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| **Base URL + allowed origins read from environment** (extends the constitution's "hardcode in `config.ts`") | FR-013 requires a configurable public address, and CORS/`trustedOrigins` must know the web app's origin per environment. | Hardcoding origins/base URL in `config.ts` would require a code change per deployment and can't be set by ops. Only these deployment values move to env; non-secret localhost **defaults stay in `config.ts`**, so local dev needs no `.env` (consistent with feature 001). |

## Phase 0 & 1 outputs

- **Phase 0** → [research.md](./research.md): 9 decisions (RentalPeriod, derived FleetStatus, the
  domain service + thin resolvers, reuse of guards/date fields, additive car fields, GraphQL
  exposure, CORS/`trustedOrigins`, configurable base URL, events-modelled-not-built).
- **Phase 1** → [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md),
  and the agent-context update (CLAUDE.md plan pointer).

## Next step

Run `/speckit-tasks` to generate the dependency-ordered, TDD-first `tasks.md`.
