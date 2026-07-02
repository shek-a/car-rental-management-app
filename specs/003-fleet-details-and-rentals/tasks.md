---
description: "Task list for Fleet Details & Rental Flow (Prototype)"
---

# Tasks: Fleet Details & Rental Flow (Prototype)

**Input**: Design documents from `specs/003-fleet-details-and-rentals/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: TDD is REQUIRED (constitution + user request). Each implementation task is preceded by a
failing-test task (Red → Green → Refactor). Unit tests mock only at boundaries (repositories); the
domain (`RentalPeriod`, `FleetStatus`, `CarRentalService`) is exercised through real code.
**Integration tests** (per the integration-testing skill) verify the persistence boundary — that the
`RentalPeriod` round-trips via the existing `leasedDate`/`returnDate` and that status derives
end-to-end — not business edge cases (those are unit tests).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5 (user-story phases only)

## Path Conventions

Single-project backend; source at `src/`. Tests colocated `*.test.ts`. Integration tests under
`test/integration/` (Docker Compose Mongo infra from feature 002). Auth guards (`requireOwnAccount`,
`requireAdministrator`) and test factories (`createNewCar`, `createAdministrator`) already exist.

---

## Phase 1: Setup

- [X] T001 Add the `cors` dependency: `yarn add cors && yarn add -D @types/cors`; verify it appears in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, model fields, and the domain value objects/repository that all stories need.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Update `src/typeDefs.ts` per `contracts/graphql-schema.delta.md`: add `enum FleetStatus`, `type RentalPeriod`, the six new `Car` fields, `Car.status`/`Car.rentalPeriod`, the new `CreateCarInput`/`UpdateCarInput` fields, and the `dueBackDate: Date!` argument on `addCarToCustomer`
- [X] T003 Run `yarn generate-graphql-types` to regenerate `src/generated/types.ts` (never hand-edit) — depends on T002
- [X] T004 [P] Add `plate`, `year`, `seats`, `transmission`, `fuel`, `colour` to the schema in `src/model/car.ts` (all optional)
- [X] T005 [P] Write failing tests in `src/domain/rental/rentalPeriod.test.ts`: constructs a `RentalPeriod` from a lease date + due-back date; equality by value; rejects a due-back date that is not after the lease date / not in the future
- [X] T006 Implement `src/domain/rental/rentalPeriod.ts` (immutable `RentalPeriod` value object + invariant) to pass T005 — depends on T005
- [X] T007 [P] Write failing tests in `src/domain/rental/fleetStatus.test.ts` for `deriveFleetStatus(rentalPeriod | null, now)`: null → `AVAILABLE`; due date > now+2d → `LEASED`; within 2 days → `DUE_SOON`; past → `OVERDUE`; and that `DUE_SOON_WINDOW_DAYS` is 2
- [X] T008 Implement `src/domain/rental/fleetStatus.ts` (`FleetStatus`, `deriveFleetStatus`, `DUE_SOON_WINDOW_DAYS`) to pass T007 — depends on T007
- [X] T009 [P] Write failing tests in `src/repository/carRepository.test.ts` for the new methods `setRentalPeriod(carId, rentalPeriod, customer)` and `clearRentalPeriod(carId)` (mock `CarModel`; verify the persisted `leasedDate`/`returnDate`/`customer` via argument capture)
- [X] T010 Implement the new `setRentalPeriod` / `clearRentalPeriod` methods in `src/repository/carRepository.ts` (persist the `RentalPeriod` via `leasedDate`/`returnDate`) to pass T009 — depends on T009, T004
- [X] T011 [P] Extend `src/testing/utilities.ts`: add the new detail fields to `createNewCar`, and add a helper to build a rented car (with a `RentalPeriod` / `leasedDate`+`returnDate`)

**Checkpoint**: Schema/types/model updated; `RentalPeriod` + `FleetStatus` unit-tested; repository can
persist/clear a rental period. No user-visible behaviour yet.

---

## Phase 3: User Story 1 - Browse cars with details and status (Priority: P1) 🎯 MVP

**Goal**: Every car returns its detail fields, a derived `status`, and (when rented) its `rentalPeriod`.

**Independent Test**: Query the catalogue and a single car unauthenticated; confirm the detail fields,
a `status` (AVAILABLE for a not-rented car), and `rentalPeriod` (null when available) are returned.

- [X] T012 [P] [US1] Write failing tests in `src/resolvers/car/fetchStatusByCar.test.ts`: returns the derived `FleetStatus` for a car given a fixed "now" — `AVAILABLE` (no period), `LEASED`, `DUE_SOON`, `OVERDUE` per the due-back date
- [X] T013 [US1] Implement `src/resolvers/car/fetchStatusByCar.ts` (Car.status field resolver delegating to `deriveFleetStatus`) to pass T012 — depends on T012, T008
- [X] T014 [P] [US1] Write failing tests in `src/resolvers/car/fetchRentalPeriodByCar.test.ts`: returns `{ leaseDate, dueBackDate }` from the car's dates when rented; `null` when the car has no rental period
- [X] T015 [US1] Implement `src/resolvers/car/fetchRentalPeriodByCar.ts` (Car.rentalPeriod projection from `leasedDate`/`returnDate`) to pass T014 — depends on T014, T006
- [X] T016 [US1] Register the `Car.status` and `Car.rentalPeriod` field resolvers under `Car` in `src/resolvers.ts` — depends on T013, T015

**Checkpoint**: US1 works — the catalogue and car detail return real fields + status. The MVP.

---

## Phase 4: User Story 2 - Rent a car for a period (Priority: P1)

**Goal**: An authenticated customer rents an available car with a due-back date; the car becomes leased
to them with a rental period. Renting stays own-account-only.

**Independent Test**: As a customer, rent an available car with a future due date; confirm the car is
associated, has a rental period, and reports `LEASED`; confirm unauthenticated/wrong-account/already-leased/past-date attempts are rejected.

- [X] T017 [P] [US2] Write failing tests in `src/domain/rental/carRentalService.test.ts` for `rentCarToCustomer(carId, customerId, dueBackDate)`: rents an available car (sets the `RentalPeriod` with lease=now + due date and links the customer — verify via captured repository args); rejects when the car is not `AVAILABLE`, when the due-back date is not in the future, when the customer already holds the car, and when car/customer are not found — mock `carRepository` and `customerRepository`
- [X] T018 [US2] Implement `rentCarToCustomer` in `src/domain/rental/carRentalService.ts` (validate invariants, set `RentalPeriod`, coordinate Car↔Customer via repositories) to pass T017 — depends on T017, T010, T006
- [X] T019 [P] [US2] Update `src/resolvers/mutations/customer/addCarToCustomer.test.ts`: resolver is now thin — unauthenticated → `AuthenticationError`; other account → `AuthorizationError`; own account → delegates to `carRentalService.rentCarToCustomer` with `(carId, customerId, dueBackDate)` (mock the service)
- [X] T020 [US2] Refactor `src/resolvers/mutations/customer/addCarToCustomer.ts` to accept `dueBackDate`, keep `requireOwnAccount`, and delegate to `carRentalService` (remove inline business logic) to pass T019 — depends on T019, T018

**Checkpoint**: US1 + US2 — customers can rent an available car for a period and see it as leased.

---

## Phase 5: User Story 3 - Return a car and free it (Priority: P1)

**Goal**: A customer returns a car they hold; the rental period is cleared and the car becomes available.

**Independent Test**: Return a held car; confirm it is freed (`AVAILABLE`, `rentalPeriod: null`) and no
longer in the customer's cars; confirm returning a car that isn't theirs is forbidden.

- [X] T021 [P] [US3] Write failing tests in `src/domain/rental/carRentalService.test.ts` for `returnCarFromCustomer(carId, customerId)`: clears the `RentalPeriod` and the Car↔Customer link (verify via captured repository args); rejects when the customer does not hold the car, and when car/customer are not found — mock the repositories
- [X] T022 [US3] Implement `returnCarFromCustomer` in `src/domain/rental/carRentalService.ts` to pass T021 — depends on T021, T010
- [X] T023 [P] [US3] Update `src/resolvers/mutations/customer/removeCarFromCustomer.test.ts`: resolver is thin — auth/own-account cases + delegates to `carRentalService.returnCarFromCustomer` (mock the service)
- [X] T024 [US3] Refactor `src/resolvers/mutations/customer/removeCarFromCustomer.ts` to keep `requireOwnAccount` and delegate to `carRentalService` (remove inline logic) to pass T023 — depends on T023, T022

**Checkpoint**: The full rent → status → return loop works and resets between demo runs.

---

## Phase 6: User Story 4 - Administrator manages car details (Priority: P2)

**Goal**: Administrators create and edit cars with the full detail field set. Car management stays admin-only.

**Independent Test**: As admin, create and update a car with the detail fields; confirm they persist and
return on reads; confirm non-admin/unauthenticated are rejected.

- [X] T025 [P] [US4] Update `src/resolvers/mutations/car/createCar.test.ts`: admin creates a car with the new detail fields and they are persisted (verify via captured save args); non-admin → forbidden; unauthenticated → unauthorized
- [X] T026 [US4] Update `src/resolvers/mutations/car/createCar.ts` to accept and persist the new detail fields — depends on T025, T003
- [X] T027 [P] [US4] Update `src/resolvers/mutations/car/updateCar.test.ts`: admin updates the detail fields (persisted); **non-admin → `AuthorizationError`; unauthenticated → `AuthenticationError`** (updateCar is currently unprotected — add the guard)
- [X] T028 [US4] Update `src/resolvers/mutations/car/updateCar.ts` to add `requireAdministrator` (accept `context`) and accept/persist the new detail fields to pass T027 — depends on T027, T003

**Checkpoint**: Admin fleet table + car editor are fully backed.

---

## Phase 7: User Story 5 - A browser web app on another origin can connect (Priority: P1)

**Goal**: A browser SPA on a different, allowed origin can call the API, auth, and photo routes; the
API's public base address is configurable.

**Independent Test**: From a page on the allowed dev origin, call `/graphQL` and load a `photo.url`
without CORS blocking; change `AUTH_BASE_URL` and confirm photo URLs reflect it.

- [X] T029 [US5] Update `src/config/config.ts` to read `AUTH_BASE_URL` and an `ALLOWED_ORIGINS` list from the environment, each with the existing localhost defaults (so local dev needs no `.env`) — per `contracts/cross-origin-and-config.contract.md`
- [X] T030 [US5] Add `trustedOrigins` (from `ALLOWED_ORIGINS`) to the Better Auth instance in `src/auth/auth.ts` — depends on T029
- [X] T031 [US5] Mount the `cors` middleware (`origin: ALLOWED_ORIGINS`, `credentials: true`, allow `Content-Type`/`Authorization`) in `src/server.ts` **before** the auth handler, GraphQL middleware, and photo route — depends on T029, T001

**Checkpoint**: A browser app on another origin can complete browse → rent → return end-to-end.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T032 [P] Add integration test `test/integration/rentalLifecycle.integration.test.ts` (Docker Compose Mongo): create a car, rent it with a due-back date, confirm the `RentalPeriod` persists via `leasedDate`/`returnDate` and the derived status is `LEASED`/`DUE_SOON`/`OVERDUE` for representative due dates, then return it and confirm it is `AVAILABLE` again with no period — verifies the persistence boundary, not business edge cases — depends on T024, T016
- [X] T033 [P] Run `yarn test` (all unit green) and `npx tsc --noEmit`; fix any type/lint issues in new code (no `any`, explicit return types)
- [ ] T034 [P] Execute quickstart scenarios A–G in `specs/003-fleet-details-and-rentals/quickstart.md` against a running server (Scenario G — CORS/base-URL — verified from a page on the allowed origin)
- [X] T035 Update `README.md` and `docs/frontend-integration/` (api-reference, schema.graphql via `yarn export-schema`) with the new `Car` fields, `status`, `rentalPeriod`, the `dueBackDate` argument, and the CORS/base-URL configuration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories.
- **User Stories**: all depend on Foundational.
  - **US1 (P1)** — status/period read side (the MVP).
  - **US2 (P1)** then **US3 (P1)** — both edit `carRentalService.ts` and a resolver; do US2 then US3.
  - **US4 (P2)** — independent of US1–US3 (admin write side of detail fields).
  - **US5 (P1)** — independent infra (config + auth + server + cors); can proceed in parallel with the others once Setup+Foundational config is in place.
- **Polish (Phase 8)**: after the user stories.

### Critical path

- T002 → T003 (schema before type regen); most foundational + US tasks depend on regenerated types.
- T006/T008 (value objects) → US1 field resolvers and the rental service.
- T010 (repository rental methods) → US2/US3 service.
- Registration/resolver edits touch `src/resolvers.ts` (T016) and each resolver file — keep per-file edits sequential.

### Within each user story

- The `*.test.ts` task (failing) comes first; implementation makes it pass; refactor while green.

---

## Parallel Execution Examples

**Foundational — independent files after T003:**

```bash
Task: T004 Add detail fields to src/model/car.ts
Task: T005 Write src/domain/rental/rentalPeriod.test.ts
Task: T007 Write src/domain/rental/fleetStatus.test.ts
Task: T009 Write src/repository/carRepository.test.ts (rental methods)
Task: T011 Extend src/testing/utilities.ts
```

**After Foundational — stories in parallel (different files):**

```bash
# Dev A — US1: T012/T013 status resolver, T014/T015 period resolver
# Dev B — US2 then US3: carRentalService rent/return + resolver refactors
# Dev C — US4: createCar/updateCar detail fields + guard
# Dev D — US5: config + trustedOrigins + cors
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE** (catalogue and car
   detail return real fields + a derived status) → demo the browse screens.

### Incremental Delivery

1. Foundation → 2. US1 (browse + status) → 3. US2 (rent for a period) → 4. US3 (return) → 5. US4 (admin
   details) → 6. US5 (browser connectivity) → 7. Polish. US5 can be pulled earlier if a browser demo is
   needed before the write side is complete.
