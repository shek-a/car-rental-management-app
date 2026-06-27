# Implementation Plan: User Authentication & Authorization

**Branch**: `001-user-authentication` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-user-authentication/spec.md`

## Summary

Add an authentication and authorization layer over the existing GraphQL API. Customers sign in with
their Google account through **Better Auth** (no platform passwords); on first sign-in a domain
`Customer` is provisioned and linked to the Google identity. Authorization is a **domain concern**:
a `Role` (`CUSTOMER | ADMINISTRATOR`) on the `Customer` aggregate gates the existing protected
operations — fleet management (create/delete car) is admin-only, rent/return is restricted to the
authenticated customer's own account, and car reads stay public. A seed administrator
(`andrew.shek23@gmail.com`) bootstraps admin access, and admins can grant the role to others via a
new `grantAdministratorRole` mutation. Better Auth is mounted on the existing Express app and read
into the Apollo context; the design follows DDD, clean-code/TypeScript, and TDD per the constitution.

## Technical Context

**Language/Version**: TypeScript ~4.8 (strict mode required by constitution), Node.js (babel-node)

**Primary Dependencies**: Apollo Server Express 3, Express 4, Mongoose 6, GraphQL 16; **adding**
`better-auth` (Google social provider, mongodb adapter, bearer plugin) + native `mongodb` driver

**Storage**: MongoDB (`mongodb://localhost:27017`), one instance shared by domain collections
(`Customer`, `Car`) and Better Auth-owned collections (`user`, `session`, `account`, `verification`)

**Testing**: Jest (unit, colocated `*.test.ts`, TDD); integration tests via Docker Compose Mongo per
the integration-testing skill

**Target Platform**: Headless Node service on port `8082` (GraphQL at `/graphQL`, auth at
`/api/auth/*`). No front end this iteration.

**Project Type**: Single-project backend (GraphQL web service)

**Performance Goals**: Not a performance feature; no new latency budget beyond one session lookup +
one Customer read per authenticated request

**Constraints**: No password storage (FR-002); reads public (FR-016); current-role-per-request
(FR-011); secrets MUST NOT be committed (see Complexity Tracking)

**Scale/Scope**: Two roles, one identity provider (Google), ~3 new domain units (provisioning, role
grant, authorization guards), 1 schema delta, guards added to 4 existing resolvers

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. Domain-Driven Design** | PASS. `Role` and provisioning modelled in the domain on the `Customer` aggregate root; a `CustomerRepository` abstracts Mongoose; Better Auth's `user` is confined to the identity boundary and mapped to `Customer`. Ubiquitous language preserved (see Complexity entry on the unavoidable library term "user"). |
| **II. Schema-First GraphQL** | PASS. Changes made in `src/typeDefs.ts` (enum + role field + mutation); `yarn generate-graphql-types` regenerates types; generated file never hand-edited. |
| **III. Test-First (NON-NEGOTIABLE)** | PASS (planned). Test cases for guards, provisioning, role grant, and protected resolvers are written and approved before implementation; Red-Green-Refactor; mock only at boundaries (Mongo, `auth.api.getSession`). |
| **IV. Clean Code & TypeScript Discipline** | PASS (planned). Custom error classes, named guard predicates, `Role` as `as const` union mirrored by the GraphQL enum, explicit return types on exports, no `any` in new code. |
| **V. Layered Architecture & Simplicity** | PASS with one justified deviation. Resolver → service → repository layering for new code; guards keep resolvers thin. Deviation: secrets via environment variables instead of hardcoded `config.ts` (Complexity Tracking). |

**Initial gate**: PASS (one deviation, justified below).
**Post-design gate** (after Phase 1): PASS — design introduced no new violations; the only deviation
remains the secrets-in-env decision, which is intrinsic to delegating credentials to Google.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-authentication/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — 10 decisions (Better Auth integration, roles, provisioning)
├── data-model.md        # Phase 1 — identity boundary + extended Customer aggregate + Role
├── contracts/
│   ├── graphql-schema.delta.md   # typeDefs changes + per-operation authorization rules
│   └── auth-http.contract.md     # Better Auth /api/auth/* endpoints + session flow
├── quickstart.md        # Phase 1 — validation scenarios mapped to success criteria
└── checklists/
    └── requirements.md  # Spec quality checklist (from /speckit-specify)
```

### Source Code (repository root)

```text
src/
├── auth/                          # NEW — authentication boundary + authorization
│   ├── auth.ts                    # Better Auth instance (Google, mongodb adapter, bearer plugin)
│   ├── authContext.ts             # Apollo context: getSession → currentCustomer (via provisioning)
│   ├── authorization.ts           # requireAuthenticatedCustomer / requireAdministrator guards
│   ├── authorization.test.ts
│   └── errors.ts                  # AuthenticationError / AuthorizationError (custom classes)
├── domain/                        # NEW — domain services & value objects
│   └── customer/
│       ├── role.ts                # Role union ('CUSTOMER' | 'ADMINISTRATOR') as const
│       ├── customerProvisioningService.ts        # resolve-or-create Customer for an identity
│       ├── customerProvisioningService.test.ts
│       ├── grantAdministratorRole.ts             # domain service: admin promotes a customer
│       └── grantAdministratorRole.test.ts
├── repository/                    # NEW — persistence abstraction (domain language)
│   ├── customerRepository.ts      # findByAuthUserId / findByEmail / findByCustomerId / save
│   └── customerRepository.test.ts
├── resolvers/
│   ├── mutations/customer/
│   │   ├── grantAdministratorRole.ts             # NEW resolver (admin-only) + .test.ts
│   │   ├── addCarToCustomer.ts                    # MODIFY — add auth + own-account guard
│   │   └── removeCarFromCustomer.ts              # MODIFY — add auth + own-account guard
│   └── mutations/car/
│       ├── createCar.ts                          # MODIFY — add requireAdministrator guard
│       └── deleteCar.ts                          # MODIFY — add requireAdministrator guard
├── config/
│   ├── config.ts                  # MODIFY — add auth base URL + seed-admin email (non-secret)
│   └── secrets.ts                 # NEW — typed env accessors for the 3 secrets
├── model/customer.ts              # MODIFY — add authUserId + role fields to the schema
├── typeDefs.ts                    # MODIFY — CustomerRole enum, role field, nullable profile, mutation
├── resolvers.ts                   # MODIFY — register grantAdministratorRole
├── apolloServer.ts                # MODIFY — add context function (auth session → currentCustomer)
└── server.ts                      # MODIFY — mount toNodeHandler(auth) before express.json()
```

**Structure Decision**: Single-project backend. New code is organized by the constitution's layers —
`auth/` (identity boundary + authorization), `domain/customer/` (domain services + Role value
object), `repository/` (persistence abstraction) — rather than scattered into resolvers. Existing
protected resolvers receive a single guard call each (minimal change); a broader refactor of legacy
resolvers to the layered pattern is explicitly **out of scope** for this feature.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| **Secrets via environment variables** (deviates from constitution's "config hardcoded in `config.ts`, no `.env`") | `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are credentials; the Google flow cannot work without them and they must not enter version control. | Hardcoding in `config.ts` would commit live OAuth credentials to git — a security vulnerability. Only secrets move to env; all non-secret config stays in `config.ts`. |
| **Better Auth introduces the term "user" and its own collections** (tension with ubiquitous language "Customer only") | The core requirement is to delegate credential management (no password table); the chosen library models identity as `user`/`session`/`account`. | Modelling our own identity/credentials in `Customer` would mean managing passwords/sessions ourselves — exactly what the feature forbids. Mitigation: `user` is confined to the auth boundary; the domain layer speaks only `Customer`, linked via `authUserId`. |

## Phase 0 & 1 outputs

- **Phase 0** → [research.md](./research.md): 10 decisions resolving all unknowns (library choice,
  Express mounting, headless session via bearer, mongodb adapter reuse, domain-owned roles,
  provisioning, context wiring, own-account enforcement, secrets, schema changes).
- **Phase 1** → [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md),
  and the agent context update (CLAUDE.md plan pointer).

## Next step

Run `/speckit-tasks` to generate the dependency-ordered, TDD-first `tasks.md` from these artifacts.
