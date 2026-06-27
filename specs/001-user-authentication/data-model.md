# Data Model: User Authentication & Authorization

**Feature**: `001-user-authentication` | **Date**: 2026-06-27

This feature adds an **identity boundary** (owned by Better Auth) and links it to the existing
**`Customer` aggregate** in the domain. Better Auth-owned collections are infrastructure at the
authentication boundary; the domain continues to speak only `Customer`, `Car`, and `Rental`.

## Boundary map

```
Google (external IdP)
      │  verified identity (sub, email, name)
      ▼
Better Auth identity boundary  ──>  collections: user, session, account, verification
      │  authUserId
      ▼
Domain aggregate: Customer (role, profile, rented cars)  ──>  collection: Customer
```

## Better Auth-owned entities (NOT hand-modelled)

Managed entirely by `better-auth` via the mongodb adapter. We never define Mongoose schemas for
these; they are listed for understanding only.

- **user**: the authenticated identity (id, email, name, emailVerified, timestamps). No password —
  credentials live with Google.
- **account**: links a `user` to a Google OAuth account (provider, providerAccountId, tokens).
- **session**: an active authenticated session (token, userId, expiresAt). Backs both cookie and
  bearer-token auth.
- **verification**: short-lived verification records used internally by the auth flows.

These satisfy the **Identity** and **Session** entities from the spec.

## Domain entity: Customer (aggregate root — extended)

The existing `Customer` is extended; it remains the aggregate root for the rental relationship.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `customerId` | ID | yes | Existing identifier. |
| `authUserId` | String | yes (for provisioned) | **New.** Stable link to the Better Auth `user.id`. Primary link key. |
| `email` | String | yes | Verified email from Google. Secondary link key (link existing account by email). |
| `firstName` | String | no | **Relaxed to optional** (Google may not supply). |
| `lastName` | String | no | **Relaxed to optional.** |
| `age` | Int | no | **Relaxed to optional** (Google does not provide). FR-013. |
| `role` | Role | yes | **New.** `CUSTOMER` or `ADMINISTRATOR`. Defaults to `CUSTOMER`. |
| `cars` | [Car] | no | Existing — cars currently rented by this customer. |

**Invariants**
- `authUserId` is unique across customers (one identity ↔ one Customer). Enforces SC-005
  (no duplicates).
- `email` resolves to at most one Customer (used to link a pre-existing account on first sign-in).
- A Customer with `role = ADMINISTRATOR` whose `email` equals the configured seed admin is assigned
  that role at provisioning time; the role is re-read each request (FR-011).
- Renting/returning continues to obey existing rules (a car already rented cannot be re-rented).

## Domain value object: Role

Immutable, identity-less — a value object per DDD.

```
Role = 'CUSTOMER' | 'ADMINISTRATOR'   // modelled as `as const` union, mirrored by the GraphQL enum CustomerRole
```

- `CUSTOMER`: may rent and return cars against their **own** account.
- `ADMINISTRATOR`: may manage the fleet (create/delete cars) and grant the administrator role to
  another Customer.

## Domain entity: Car (unchanged)

No structural change. The rent/return operations that mutate `Car.customer` are now subject to
authorization, but the `Car` shape is unchanged.

## State & transitions

**Customer provisioning (idempotent resolve-or-create):**

```
authenticated request
   → find Customer by authUserId ──found──> return (re-evaluate role)
   → else find Customer by email ──found──> link authUserId, return
   → else create Customer (role = seed-admin? ADMINISTRATOR : CUSTOMER)
```

**Role transition:**

```
CUSTOMER ──grantAdministratorRole (by an ADMINISTRATOR)──> ADMINISTRATOR
```

Seed administrator (`andrew.shek23@gmail.com`) starts as `ADMINISTRATOR` at provisioning without any
prior grant.

## Mapping to functional requirements

| Requirement | Data-model element |
|-------------|--------------------|
| FR-001/002 | Better Auth `user`/`account` (no password field) |
| FR-003/004, SC-005 | `Customer.authUserId` unique + provisioning resolve-or-create |
| FR-005/006 | Better Auth `session` (cookie + bearer) |
| FR-007/009/010/012 | `Customer.role` (Role value object) + authorization guards |
| FR-008 | seed-admin config + `grantAdministratorRole` transition |
| FR-011, SC-006 | role re-read from `Customer` each request |
| FR-013 | `firstName`/`lastName`/`age` optional |
| FR-014 | existing `Customer.cars` ↔ `Car.customer` link, set from authenticated customer |
