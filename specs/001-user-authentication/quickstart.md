# Quickstart & Validation: User Authentication & Authorization

**Feature**: `001-user-authentication`

This guide proves the feature works end-to-end. It references
[contracts/](./contracts/) and [data-model.md](./data-model.md) rather than repeating details.
Implementation lives in `tasks.md` / the implementation phase — not here.

## Prerequisites

- Node.js, Yarn, Docker (per project setup).
- A Google OAuth client (Web application) with redirect URI
  `http://localhost:8082/api/auth/callback/google`.
- Environment variables exported before `yarn start` (secrets — see
  [contracts/auth-http.contract.md](./contracts/auth-http.contract.md)):
  ```bash
  export BETTER_AUTH_SECRET=...        # random 32+ char string
  export GOOGLE_CLIENT_ID=...
  export GOOGLE_CLIENT_SECRET=...
  ```

## Setup

```bash
yarn                                                   # install (now includes better-auth)
docker run -d -p 27017:27017 --name car-rental-magement-app mongo   # MongoDB
yarn generate-graphql-types                            # regenerate types after schema delta
yarn start                                             # http://localhost:8082
```

## Automated tests (primary validation)

```bash
yarn test                                              # all unit tests (TDD) must pass
yarn test -- --testPathPattern src/auth                # authorization guards
yarn test -- --testPathPattern customerProvisioning    # provisioning resolve-or-create
yarn test -- --testPathPattern grantAdministratorRole  # role grant
yarn test:integration                                  # Docker Compose Mongo (if configured)
```

Unit tests cover the business rules; the manual scenarios below confirm the wiring.

## Manual end-to-end scenarios

### Scenario A — Sign up / sign in with Google (US1, SC-001, SC-005)
1. Open `http://localhost:8082/api/auth/sign-in/social?provider=google` in a browser; complete
   Google consent.
2. Capture the session token from the `set-auth-token` response header.
3. **Expected**: a `Customer` now exists for that identity (query `customers`), no password stored,
   and signing in again with the same Google account reuses the same `Customer` (no duplicate).

### Scenario B — Authenticated rent / return, own account only (US2, SC-002, SC-004)
1. With `Authorization: Bearer <token>`, call `addCarToCustomer(carId, customerId)` using **your
   own** `customerId`. **Expected**: success; the car is associated with your account.
2. Repeat with **no** Authorization header. **Expected**: unauthorized error (SC-002).
3. Repeat with another customer's `customerId`. **Expected**: forbidden error (SC-004).
4. Call `removeCarFromCustomer` for your own rental. **Expected**: success.

### Scenario C — Administrator manages fleet (US3, SC-002, SC-003)
1. Sign in as the seed admin (`andrew.shek23@gmail.com`). Call `createCar` then `deleteCar` with the
   bearer token. **Expected**: both succeed.
2. As a non-admin customer, call `createCar`/`deleteCar`. **Expected**: forbidden (SC-003).
3. Unauthenticated `createCar`/`deleteCar`. **Expected**: unauthorized (SC-002).

### Scenario D — Grant administrator role (FR-008, SC-006)
1. As the seed admin, call `grantAdministratorRole(customerId)` for another customer. **Expected**:
   that customer's `role` becomes `ADMINISTRATOR` and they can immediately perform admin actions on
   their next request — no re-sign-in (SC-006).
2. As a non-admin, call `grantAdministratorRole`. **Expected**: forbidden.

### Scenario E — Public browsing (FR-016)
1. With no Authorization header, query `cars` / `car(carId)`. **Expected**: success (reads are
   public).

## Success criteria coverage

| Scenario | Covers |
|----------|--------|
| A | SC-001, SC-005 |
| B | SC-002, SC-004 |
| C | SC-002, SC-003 |
| D | SC-006, FR-008 |
| E | FR-016 |
