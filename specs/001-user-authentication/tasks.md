---
description: "Task list for User Authentication & Authorization"
---

# Tasks: User Authentication & Authorization

**Input**: Design documents from `specs/001-user-authentication/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are INCLUDED and REQUIRED — the constitution mandates TDD (Red-Green-Refactor).
Each implementation task is preceded by a failing-test task. Per the TDD skill, the test cases in
each `*.test.ts` task MUST be reviewed/approved before the implementation task makes them pass.

**Organization**: Tasks are grouped by user story. US1 is the MVP. US2 and US3 are independent of
each other once US1 is in place.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (user-story phases only)

## Path Conventions

Single-project backend; source at repository `src/`. Tests are colocated `*.test.ts`. Shared mock
factories in `src/testing/utilities.ts`. Integration tests under `test/integration/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies and configuration scaffolding.

- [X] T001 Add `better-auth` and `mongodb` dependencies via `yarn add better-auth mongodb` and verify they appear in `package.json`
- [X] T002 [P] Create typed secret accessors in `src/config/secrets.ts` reading `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` from `process.env` (explicit return types; throw a clear error if a required secret is missing)
- [X] T003 [P] Add non-secret auth config to `src/config/config.ts`: `AUTH_BASE_URL` (`http://localhost:8082`), `AUTH_PATH` (`/api/auth`), and `SEED_ADMIN_EMAIL` (`andrew.shek23@gmail.com`) as named constants
- [X] T004 [P] Set up integration-test infrastructure per the integration-testing skill: `docker-compose.integration.yml` (mongo:6 with healthcheck), `jest.integration.config.js`, `test/integration/global-setup.ts`, `test/integration/global-teardown.ts`, and a `test:integration` script in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identity boundary, schema, domain primitives, repository, and authorization guards that
ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Update `src/typeDefs.ts` per `contracts/graphql-schema.delta.md`: add `enum CustomerRole { CUSTOMER ADMINISTRATOR }`, add `Customer.role: CustomerRole!`, relax `firstName`/`lastName` to `String` and `age` to `Int`, and add `grantAdministratorRole(customerId: ID!): Customer` mutation
- [X] T006 Run `yarn generate-graphql-types` to regenerate `src/generated/types.ts` (never hand-edit) — depends on T005
- [X] T007 [P] Add `authUserId: String` and `role: String` fields to the schema in `src/model/customer.ts`
- [X] T008 [P] Create the `Role` value object in `src/domain/customer/role.ts` (domain role helpers over the generated `CustomerRole` enum: `isAdministrator`, `roleForNewCustomer`)
- [X] T009 [P] Create custom error classes in `src/auth/errors.ts`: `AuthenticationError` (unauthorized) and `AuthorizationError` (forbidden), each extending `Error` with `name` and `Error.captureStackTrace`
- [X] T010 [P] Extend `src/testing/utilities.ts`: add `role` to `createNewCustomer`, add a `createAdministrator(...)` factory, and a `createCustomerInput(...)` factory
- [X] T011 [P] Write failing tests in `src/repository/customerRepository.test.ts` for `findByAuthUserId`, `findByEmail`, `findByCustomerId`, `create`, and `update` (mock `CustomerModel` at the boundary; verify query arguments via capture)
- [X] T012 Implement `src/repository/customerRepository.ts` to pass T011 (abstracts `CustomerModel`; speaks domain language; explicit return types) — depends on T011, T007
- [X] T013 [P] Write failing tests in `src/auth/authorization.test.ts` for three guards: `requireAuthenticatedCustomer` (throws `AuthenticationError` when `currentCustomer` is null), `requireAdministrator` (throws `AuthorizationError` when role is `CUSTOMER`, passes for `ADMINISTRATOR`), and `requireOwnAccount` (throws `AuthorizationError` when the target customerId differs from the caller's)
- [X] T014 Implement `src/auth/authorization.ts` with the three named guard predicates to pass T013 — depends on T013, T008, T009
- [X] T015 Create the Better Auth instance in `src/auth/auth.ts`: Google social provider (secrets from T002), `mongodbAdapter` (dedicated `MongoClient` to the same MongoDB instance — lazy `.db()`, no connection-timing dependency), and the `bearer` plugin — depends on T001, T002, T007
- [X] T016 Mount `toNodeHandler(auth)` at `${AUTH_PATH}/*` in `src/server.ts` BEFORE `express.json()` — depends on T015
- [X] T017 Create `src/auth/authContext.ts` exporting an `AuthContext` interface (`currentCustomer: Customer | null`) and a context builder that calls `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` and sets `currentCustomer = null` for now (provisioning wired in US1); wire this context function into `src/apolloServer.ts` — depends on T015, T014

**Checkpoint**: Server boots with `/api/auth/*` live, sessions are readable, guards and repository
exist and are unit-tested. No user-visible behavior yet.

---

## Phase 3: User Story 1 - Sign up and sign in with a Google account (Priority: P1) 🎯 MVP

**Goal**: First Google sign-in provisions a domain `Customer` linked to the identity; repeat
sign-ins reuse it; the seed admin email is provisioned as `ADMINISTRATOR`.

**Independent Test**: Authenticate as a new Google identity → an authenticated session exists and a
`Customer` is created. Authenticate again → same `Customer`, no duplicate (quickstart Scenario A).

- [X] T018 [P] [US1] Write failing tests in `src/domain/customer/customerProvisioningService.test.ts`: resolves existing by `authUserId`; links existing by `email` (sets `authUserId`); creates a new `Customer` when none exists; assigns `ADMINISTRATOR` when email equals `SEED_ADMIN_EMAIL`; is idempotent (no duplicate) — mock `CustomerRepository`, use real `Customer`/`Role`
- [X] T019 [US1] Implement `src/domain/customer/customerProvisioningService.ts` (resolve-or-create, seed-admin role assignment) to pass T018 — depends on T018, T012
- [X] T020 [US1] Wire the provisioning service into `src/auth/authContext.ts` so a valid session resolves/creates `currentCustomer` (replace the null placeholder) — depends on T019, T017
- [X] T021 [US1] Add integration test `test/integration/customerProvisioning.integration.test.ts`: provisioning writes a persisted `Customer` in Mongo and a repeat sign-in reuses it (no duplicate) — **passing against Docker Mongo** — depends on T020, T004

**Checkpoint**: US1 is fully functional and independently testable — the MVP. Sign-in establishes an
account with zero stored passwords.

---

## Phase 4: User Story 2 - Authenticated customer rents and returns cars (Priority: P1)

**Goal**: Rent/return require authentication and are restricted to the caller's own account.

**Independent Test**: As an authenticated customer, rent then return a car against your own account
(success); unauthenticated is unauthorized; another customer's id is forbidden (quickstart Scenario B).

- [X] T022 [P] [US2] Extend `src/resolvers/mutations/customer/addCarToCustomer.test.ts` with failing cases: unauthenticated context → `AuthenticationError`; `customerId` ≠ caller's → `AuthorizationError`; own account → success (pass `context` as the 3rd resolver arg)
- [X] T023 [US2] Modify `src/resolvers/mutations/customer/addCarToCustomer.ts` to accept `context` and call `requireOwnAccount(context, customerId)` before existing logic — depends on T022, T014, T020
- [X] T024 [P] [US2] Extend `src/resolvers/mutations/customer/removeCarFromCustomer.test.ts` with the same failing auth/ownership cases
- [X] T025 [US2] Modify `src/resolvers/mutations/customer/removeCarFromCustomer.ts` to enforce `requireOwnAccount` — depends on T024, T014, T020

**Checkpoint**: US1 + US2 work. Renting/returning is authenticated and own-account-only.

---

## Phase 5: User Story 3 - Administrator manages the car fleet (Priority: P2)

**Goal**: Create/delete car restricted to administrators; an admin can grant the administrator role
to another customer.

**Independent Test**: As the seed admin, create and delete a car (success) and grant admin to another
customer; as a non-admin, all three are forbidden; unauthenticated is unauthorized (quickstart
Scenarios C, D).

- [X] T026 [P] [US3] Extend `src/resolvers/mutations/car/createCar.test.ts` with failing cases: unauthenticated → `AuthenticationError`; non-admin → `AuthorizationError`; admin → success (pass `context`)
- [X] T027 [US3] Modify `src/resolvers/mutations/car/createCar.ts` to accept `context` and call `requireAdministrator` before existing logic — depends on T026, T014, T020
- [X] T028 [P] [US3] Extend `src/resolvers/mutations/car/deleteCar.test.ts` with the same failing admin/auth cases
- [X] T029 [US3] Modify `src/resolvers/mutations/car/deleteCar.ts` to call `requireAdministrator` — depends on T028, T014, T020
- [X] T030 [P] [US3] Write failing tests in `src/domain/customer/grantAdministratorRole.test.ts`: promotes a `CUSTOMER` to `ADMINISTRATOR`; persists via repository (verify saved role by capture); idempotent for an existing admin
- [X] T031 [US3] Implement `src/domain/customer/grantAdministratorRole.ts` domain service to pass T030 — depends on T030, T012
- [X] T032 [P] [US3] Write failing tests in `src/resolvers/mutations/customer/grantAdministratorRole.test.ts`: non-admin context → `AuthorizationError`; admin context → target customer returned with `ADMINISTRATOR`
- [X] T033 [US3] Implement the `src/resolvers/mutations/customer/grantAdministratorRole.ts` resolver (accept `context`, call `requireAdministrator`, delegate to the domain service) to pass T032 — depends on T032, T031, T014
- [X] T034 [US3] Register `grantAdministratorRole` in `src/resolvers.ts` under `Mutation` — depends on T033

**Checkpoint**: All user stories functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, quality gates, and docs.

- [X] T035 [P] Run `yarn test` (57 unit tests green) and `tsc --noEmit` (whole project typechecks after the TypeScript 5 upgrade required by Better Auth's type declarations). New source files are lint-clean; the remaining `yarn lint` errors are pre-existing legacy `@ts-ignore`/`any` usages not introduced by this feature
- [ ] T036 [P] Execute quickstart manual scenarios A–E in `specs/001-user-authentication/quickstart.md` — **DEFERRED: requires live Google OAuth credentials + a browser; cannot be run in this environment** (the unit + provisioning integration tests cover the logic)
- [ ] T037 [P] Add an end-to-end integration test `test/integration/authorization.integration.test.ts` covering an admin-only op and an own-account rental against real Mongo — **DEFERRED (optional): a full E2E needs a live Better Auth session (Google); the provisioning boundary is already covered by T021**
- [X] T038 Update `README.md` with the required env vars and the Google sign-in → bearer-token flow from `contracts/auth-http.contract.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational.
  - **US1 (P1)**: depends only on Foundational. The MVP.
  - **US2 (P1)** and **US3 (P2)**: depend on Foundational + US1 (need `currentCustomer` populated by
    T020). US2 and US3 are independent of each other and may run in parallel after US1.
- **Polish (Phase 6)**: Depends on the user stories being delivered.

### Critical-path notes

- T005 → T006 (schema before type regen). Many foundational tasks depend on regenerated types (T006).
- T015 (auth instance) → T016 (mount) and → T017 (context). T020 (US1) populates the context that
  US2/US3 guards rely on.

### Within Each User Story

- The `*.test.ts` task (failing) comes first; implementation makes it pass; refactor while green.

---

## Parallel Execution Examples

**Foundational — independent files after T006:**

```bash
# Role VO, errors, model fields, test utilities, repository tests can proceed together:
Task: T007 Add authUserId/role to src/model/customer.ts
Task: T008 Create src/domain/customer/role.ts
Task: T009 Create src/auth/errors.ts
Task: T010 Extend src/testing/utilities.ts
Task: T011 Write src/repository/customerRepository.test.ts
Task: T013 Write src/auth/authorization.test.ts
```

**After US1, US2 and US3 in parallel (different files):**

```bash
# Developer A — US2:
Task: T022 addCarToCustomer.test.ts ; T023 addCarToCustomer.ts
Task: T024 removeCarFromCustomer.test.ts ; T025 removeCarFromCustomer.ts
# Developer B — US3:
Task: T026 createCar.test.ts ; T027 createCar.ts
Task: T030 grantAdministratorRole.test.ts ; T031 grantAdministratorRole.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. **STOP & VALIDATE** (Scenario A:
   sign-in provisions and reuses a Customer, no passwords stored) → deploy/demo.

### Incremental Delivery

1. Foundation ready → 2. US1 (MVP, sign-in + provisioning) → 3. US2 (authenticated own-account
   rent/return) → 4. US3 (admin fleet + role grant) → 5. Polish. Each increment is independently
   testable and adds value without breaking the prior one.
