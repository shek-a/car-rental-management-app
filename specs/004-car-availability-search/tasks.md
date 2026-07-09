---
description: "Task list for Car Availability Search (Location + Date Range)"
---

# Tasks: Car Availability Search (Location + Date Range)

**Input**: Design documents from `specs/004-car-availability-search/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: TDD is REQUIRED (constitution Principle III + user request). Every implementation task is
preceded by a failing-test task (Red → Green → Refactor), and **test cases must be presented to the
user for approval before the implementation task of that pair begins**. Unit tests mock only at
boundaries (`carRepository`, `CarModel`) and return real domain objects from the factories in
`src/testing/utilities.ts`; the domain (`Location`, `periodsOverlap`, `carAvailabilityService`) is
exercised through real code, and argument capture verifies values passed to mocks (no
`expect.anything()`). **Integration tests** (per the integration-testing skill) verify only the
boundary — that the collation-based location match works against real Mongo and the query is wired
end-to-end — not availability edge cases (those are unit tests).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US3 (user-story phases only)

## Path Conventions

Single-project backend; source at `src/`, tests colocated `*.test.ts`. Integration tests under
`test/integration/` (Docker Compose Mongo infra from feature 002 — `yarn test:integration`). Auth
guard `requireAdministrator` and factories `createNewCar`/`createRentedCar` already exist. All new
code follows the TypeScript skill: no `any`, explicit return types on exports, frozen value
objects, named predicates, no unexplained `as`.

---

## Phase 1: Setup

**Purpose**: Confirm a green baseline on the feature branch — no new dependencies are needed.

- [X] T001 On branch `feature/car-availability-search`, run `yarn test` and `yarn test:integration` and confirm both pass before any change (clean Red/Green signal for TDD)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema delta, regenerated types, model field, and the `Location` value object that
US1 (search normalization) and US2 (mutation validation) both need.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Update `src/typeDefs.ts` per `contracts/graphql-schema.delta.md`: add `location: String` to `type Car`, new `input RentalPeriodInput { leaseDate: Date! dueBackDate: Date! }`, `searchAvailableCars(location: String!, requestedPeriod: RentalPeriodInput!): [Car!]!` on `type Query`, and optional `location: String` on `CreateCarInput` and `UpdateCarInput`
- [X] T003 Run `yarn generate-graphql-types` to regenerate `src/generated/types.ts` (never hand-edit) — depends on T002
- [X] T004 [P] Add optional `location: String` to `carSchema` in `src/model/car.ts` (additive; no default, absent on legacy cars)
- [X] T005 [P] Write failing tests in `src/domain/car/location.test.ts` for the `Location` value object: trims surrounding whitespace; rejects blank (empty/whitespace-only) with a clear error; equality is case-insensitive (`" melbourne "` ≡ `"Melbourne"`); frozen/immutable; preserves original casing for display
- [X] T006 Implement `src/domain/car/location.ts` (immutable `Location` value object with factory + case-insensitive equality, mirroring the `rentalPeriod.ts` style) to pass T005 — depends on T005
- [X] T007 [P] Extend `src/testing/utilities.ts`: allow `createNewCar`/`createRentedCar` to take an optional `location` so story tests can build located cars

**Checkpoint**: Schema/types/model updated; `Location` unit-tested. No user-visible behaviour yet.

---

## Phase 3: User Story 1 - Search available cars by location and dates (Priority: P1) 🎯 MVP

**Goal**: One public query — `searchAvailableCars(location, requestedPeriod)` — returns exactly the
cars at that location that are free for the whole period (no overlap incl. boundary day; overdue
cars never offered), with the same `Car` shape the catalogue grid already renders.

**Independent Test**: Seed cars per `quickstart.md` §2 (free / rented / overdue / other-location /
no-location) and run the §3 searches a–e unauthenticated; results match exactly.

### Tests for User Story 1 (write first — must FAIL; present to user for approval)

- [X] T008 [P] [US1] Write failing tests in `src/domain/rental/rentalPeriod.test.ts` (extend existing file) for `periodsOverlap(a, b)` using the data-model truth table: contained → true; partial → true; boundary day (pickup on due-back day) → true **even when times of day differ** (e.g. due back Jul 20 00:00 vs pickup Jul 20 15:00 — comparison is at UTC calendar-day granularity); disjoint → false; symmetric in its arguments
- [X] T009 [P] [US1] Write failing capability tests in `src/domain/rental/carAvailabilityService.test.ts` (business-requirement names, e.g. "excludes a car whose rental overlaps the requested period"): car with no rental → included (FR-004); overlapping rental incl. boundary day → excluded (FR-005); rental ending before the request → included; overdue car → excluded even for non-overlapping periods (FR-006, fixed `now`); mock **only** `carRepository.findByLocation` returning real `CarEntity` objects from the factories; verify the location argument via capture
- [X] T010 [P] [US1] Write failing tests in `src/repository/carRepository.test.ts` (extend existing file) for `findByLocation(location)`: mock `CarModel.find` and capture arguments — filter is `{ location: <trimmed value> }` and the query applies collation `{ locale: "en", strength: 2 }`

### Implementation for User Story 1

- [X] T011 [US1] Implement `periodsOverlap` in `src/domain/rental/rentalPeriod.ts` (inclusive interval overlap after truncating both periods' dates to their UTC calendar day, explicit return type) to pass T008 — depends on T008
- [X] T012 [US1] Implement `findByLocation` in `src/repository/carRepository.ts` (domain-language method hiding the Mongoose collation detail) to pass T010 — depends on T010, T004
- [X] T013 [US1] Implement `src/domain/rental/carAvailabilityService.ts`: named predicate `isAvailableForPeriod(rentalPeriod | null, requestedPeriod, now)` (reuses `deriveFleetStatus` for the OVERDUE rule and `periodsOverlap` for conflicts) and stateless `searchAvailableCars(location, requestedPeriod, now)` = `findByLocation` → filter, to pass T009 — depends on T009, T011, T012, T006
- [X] T014 [P] [US1] Write failing tests in `src/resolvers/queries/car/searchAvailableCars.test.ts`: thin resolver builds the `Location` and `RentalPeriod` value objects from args and delegates to `carAvailabilityService` (capture the arguments passed); returns the service's cars unchanged; empty result → `[]` not an error (FR-010); no auth guard (public, FR-001)
- [X] T015 [US1] Implement `src/resolvers/queries/car/searchAvailableCars.ts` (guard-free, delegate-only, generated types; the `Date` scalar is an unregistered passthrough, so convert the raw string args with `new Date(...)` before `createRentalPeriod`, following the `addCarToCustomer.ts` convention) to pass T014; export it from `src/resolvers/queries/car/index.ts` and register the query in `src/resolvers.ts` — depends on T014, T013, T003
- [X] T016 [US1] Write integration test `test/integration/carAvailabilitySearch.integration.test.ts` (boundary only, per the integration-testing skill): persist cars with/without `location` in real Mongo; `findByLocation` matches case-insensitively (`" melbourne "` → `"Melbourne"` cars) and omits no-location cars **while the plain `cars` listing still returns them (FR-003)**; one end-to-end `searchAvailableCars` execution proves resolver → service → repository → Mongo wiring **and asserts a returned car still exposes the catalogue shape — including `Car.status`/`Car.photo` via the registered field resolvers (FR-009)** — run via `yarn test:integration` — depends on T015
- [X] T017 [US1] Verify US1: `yarn test` and `yarn test:integration` green; run `quickstart.md` §2–§3 scenarios a–e against `yarn start` and confirm expected car IDs — depends on T016

**Checkpoint**: The hero search bar has a working backing API. The MVP — demoable on its own.

---

## Phase 4: User Story 2 - Record where a car is located (Priority: P2)

**Goal**: Administrators capture/change a car's location through the existing `createCar`/`updateCar`
mutations (validated by the `Location` value object), making cars searchable at that location.

**Independent Test**: As an administrator, create a car with a location and update another car's
location; confirm `Car.location` comes back trimmed via the existing `car` query (independent of
US1), and blank locations are rejected.

### Tests for User Story 2 (write first — must FAIL; present to user for approval)

- [X] T018 [P] [US2] Extend `src/resolvers/mutations/car/createCar.test.ts` with failing tests: admin creating a car with `location: " Melbourne "` persists trimmed `"Melbourne"` (argument capture on the mocked `CarModel`); blank location → validation error and nothing saved; omitted location → car saved with no `location` (legacy behaviour intact)
- [X] T019 [P] [US2] Extend `src/resolvers/mutations/car/updateCar.test.ts` with failing tests: updating `location` persists the trimmed value (argument capture); blank location → validation error and no update; explicit `location: null` → validation error and no update (a location can be changed but not cleared — the contract's explicit-null rule); input without `location` leaves the field untouched

### Implementation for User Story 2

- [X] T020 [US2] Implement location acceptance in `src/resolvers/mutations/car/createCar.ts`: when `input.location` is present, validate/normalize it through the `Location` value object before persisting, to pass T018 — depends on T018, T006, T003
- [X] T021 [US2] Implement location acceptance in `src/resolvers/mutations/car/updateCar.ts` the same way — including rejecting an explicit `location: null` before the input reaches `findOneAndUpdate` (which would otherwise silently clear the field) — to pass T019 — depends on T019, T006, T003
- [X] T022 [US2] Verify US2: `yarn test` green; run `quickstart.md` §4 as an admin — move a car to another location and confirm searches at old/new locations reflect the move (uses US1; the `car` query check alone suffices if US1 is not built yet) — depends on T020, T021

**Checkpoint**: Locations are user-manageable; US1 + US2 form the complete search feature.

---

## Phase 5: User Story 3 - Invalid searches are rejected clearly (Priority: P3)

**Goal**: Nonsensical searches (due-back ≤ pickup, unparseable dates, blank location) fail with the
exact error contract in `contracts/graphql-schema.delta.md` — never a partial or misleading result.

**Independent Test**: Run `quickstart.md` §3 scenario f plus a blank-location search; each returns a
GraphQL error with a clear message and no `data.searchAvailableCars`.

### Tests for User Story 3 (write first — must FAIL; present to user for approval)

- [X] T023 [P] [US3] Extend `src/resolvers/queries/car/searchAvailableCars.test.ts` with failing tests pinning the error contract: `dueBackDate` ≤ `leaseDate` → error message "A rental period's due-back date must be after its lease date" (the existing `createRentalPeriod` invariant); unparseable/invalid dates → invalid-period error; blank `location` argument → the `Location` non-blank error; in every case the service is **not** called (capture/verify) and no result list is returned (note: the `Date` scalar is a passthrough with no scalar resolver, so unreadable-date errors are expected to surface from `createRentalPeriod`'s invalid-date guard, not the GraphQL layer)

### Implementation for User Story 3

- [X] T024 [US3] Adjust `src/resolvers/queries/car/searchAvailableCars.ts` so value-object construction happens before any repository/service work and the raised errors surface the contract's messages verbatim, to pass T023 — depends on T023, T015

**Checkpoint**: All three stories independently functional; validation contract locked by tests.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Verify `src/typeDefs.ts` matches `contracts/graphql-schema.delta.md` exactly (`yarn export-schema` and diff against the contract) and that `src/generated/types.ts` was regenerated, not hand-edited
- [X] T026 [P] Review all new/modified files against the TypeScript-skill checklist: no `any`, no unexplained `as`, explicit return types on exports, `interface` for shapes, frozen value objects, named predicates, no repeated magic strings
- [X] T027 Run the full `quickstart.md` validation end-to-end (§1–§4 including cleanup) and confirm every listed expectation, then `yarn test && yarn test:integration && yarn lint` one final time
- [X] T028 [P] Update `README.md`'s feature description to mention location + date-range availability search

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately
- **Foundational (Phase 2)**: after Setup — **blocks all stories** (T003 depends on T002; T006 on T005)
- **US1 (Phase 3)**: after Phase 2 — no other story dependencies
- **US2 (Phase 4)**: after Phase 2 — independent of US1 (full quickstart §4 journey optionally uses US1)
- **US3 (Phase 5)**: after US1's T015 (it pins the search resolver's error contract)
- **Polish (Phase 6)**: after all desired stories

### Within Each Story (Red → Green)

Failing tests (approved by the user) → implementation to green → refactor with tests green.
T011/T012 unblock T013; T013 unblocks T015; T016–T017 close US1.

### Parallel Opportunities

- Phase 2: T004, T005, T007 in parallel (T002→T003 sequential)
- US1 tests: T008, T009, T010 in parallel; later T014 parallel to nothing pending
- US2 tests: T018 ∥ T019; implementations T020 ∥ T021 (different files)
- Once Phase 2 completes, US1 and US2 can proceed in parallel (different files throughout)
- Polish: T025, T026, T028 in parallel

## Parallel Example: User Story 1

```bash
# After Phase 2, launch the three failing-test tasks together:
Task: "T008 periodsOverlap truth-table tests in src/domain/rental/rentalPeriod.test.ts"
Task: "T009 availability capability tests in src/domain/rental/carAvailabilityService.test.ts"
Task: "T010 findByLocation collation tests in src/repository/carRepository.test.ts"
```

## Implementation Strategy

**MVP first**: Phases 1–3 only (T001–T017) deliver the working search API — the single capability
the web app's hero bar needs; demo it, then decide. **Incremental**: add US2 (staff-manageable
locations) next, US3 (error-contract hardening) last; each phase ends with the full suite green and
a quickstart validation, so every increment is shippable. Commit after each Red→Green pair.
