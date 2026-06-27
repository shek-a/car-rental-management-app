# Research: User Authentication & Authorization

**Feature**: `001-user-authentication` | **Date**: 2026-06-27

All research below resolves the "NEEDS CLARIFICATION" items from Technical Context. Sources:
Better Auth official docs via Context7 (`/better-auth/better-auth`), the existing codebase, and the
project constitution.

## Decision 1 — Authentication library

- **Decision**: Use **Better Auth** (`better-auth`) as the authentication library, configured with
  the Google social provider only.
- **Rationale**: The user explicitly requested it. It is framework-agnostic, TypeScript-first
  (no hand-written types needed), open source, and delegates credential handling to Google — so the
  platform never stores passwords (FR-002). It ships first-class Express, MongoDB, Google, and
  bearer-token support, which exactly matches this stack.
- **Alternatives considered**: Passport.js (more boilerplate, callback-style, weaker TS types);
  Auth.js/NextAuth (frontend/Next-oriented, awkward for a headless GraphQL API); rolling our own
  OAuth (explicitly out of scope — the whole point is to not manage credentials).

## Decision 2 — Mounting on Express

- **Decision**: Mount Better Auth as a catch-all Express handler **before** `express.json()`:
  `app.all("/api/auth/*", toNodeHandler(auth))`, then `app.use(express.json())`, then Apollo's
  middleware on `/graphQL`.
- **Rationale**: This is the documented Express integration. The auth handler must see the raw body,
  so JSON parsing is mounted after it. Apollo and Better Auth coexist on the same Express app and
  the same port (8082).
- **Alternatives considered**: A separate auth microservice (over-engineered for this scope,
  violates KISS); putting `express.json()` first (breaks Better Auth body handling).

## Decision 3 — Completing Google sign-in without a front end (session acquisition)

- **Decision**: Enable the **bearer plugin**. An API client obtains a session by opening the social
  sign-in URL in a browser once (Google's consent screen is unavoidable for OAuth), after which
  Better Auth issues a session token returned in the `set-auth-token` response header. The client
  then sends that token as `Authorization: Bearer <token>` on subsequent GraphQL requests.
- **Rationale**: OAuth inherently requires a browser redirect to Google for consent — that is a
  property of the protocol, not of having a front end. The bearer plugin lets a non-browser API
  client carry the resulting session via a header instead of cookies, which is what a headless
  GraphQL client needs today and what the future front end can also use.
- **Alternatives considered**: Cookie-only sessions (awkward for non-browser API clients);
  service-account / machine tokens (doesn't model real customer identities, fails FR-001).

## Decision 4 — Persistence adapter (reuse the existing MongoDB)

- **Decision**: Use Better Auth's **mongodbAdapter**, pointed at the **same** MongoDB instance the
  app already uses, by passing the native `Db` obtained from the established Mongoose connection
  (`mongoose.connection.getClient().db()`). Auth collections (`user`, `session`, `account`,
  `verification`) live alongside `Customer` and `Car`.
- **Rationale**: One database, one connection, no second infrastructure dependency (KISS). Better
  Auth manages its own collections; we never hand-model them. Reusing the Mongoose connection avoids
  a duplicate client. Connection ordering: connect Mongoose first, then build the auth instance.
- **Alternatives considered**: A separate dedicated `MongoClient` for Better Auth (extra connection,
  more config); a different database (needless operational overhead).

## Decision 5 — Where authorization roles live (domain vs. library)

- **Decision**: Model the **role as a domain concept on the `Customer` aggregate** (`Role` =
  `CUSTOMER | ADMINISTRATOR`), not via Better Auth's admin plugin. Better Auth is used for
  **authentication only** (identity + session). Authorization rules and role storage live in the
  domain layer.
- **Rationale**: The constitution makes `Customer` the aggregate root and demands the ubiquitous
  language and that business rules live in domain services/entities — not in a library. Keeping
  `Role` on `Customer` keeps authorization testable without the auth library and avoids importing the
  admin plugin's broad surface (ban/impersonate/list) we don't need (YAGNI).
- **Alternatives considered**: Better Auth **admin plugin** (brings role management but buries
  authorization in the identity boundary and adds unused capabilities); a separate permissions
  service (over-engineered for two roles).

## Decision 6 — Linking a Google identity to a domain Customer (provisioning)

- **Decision**: Introduce a **CustomerProvisioningService** (domain service) that, given a validated
  identity, **resolves-or-creates** the `Customer`: look up by stable `authUserId`, else by verified
  `email` (link the existing account), else create a new `Customer`. It is **idempotent** and is
  invoked from the Apollo context builder on each authenticated request, guaranteeing a `Customer`
  exists for any authenticated caller. If the verified email equals the configured **seed
  administrator** (`andrew.shek23@gmail.com`), the resolved `Customer` is assigned the
  `ADMINISTRATOR` role.
- **Rationale**: Satisfies FR-003 (create on first sign-in), FR-004/SC-005 (reuse, never duplicate),
  the "link by existing email" edge case, and FR-008 (seed admin) — all in one domain service with a
  single responsibility. Lazy resolution in context keeps the domain in control and keeps role
  evaluation current on every request (FR-011/SC-006).
- **Alternatives considered**: Better Auth `databaseHooks.user.create.after` (provisioning logic
  leaks into the library boundary); eager provisioning at sign-in only (misses already-existing
  pre-auth Customers and complicates linking by email).

## Decision 7 — Carrying identity into GraphQL & enforcing access

- **Decision**: The Apollo **context function** reads request headers, calls
  `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, and (if a session exists) uses
  the provisioning service to attach `currentCustomer` to context (else `null`). Two named guard
  predicates — `requireAuthenticatedCustomer(context)` and `requireAdministrator(context)` — are
  called at the top of protected resolvers. They throw `AuthenticationError` (→ unauthorized) or
  `AuthorizationError` (→ forbidden).
- **Rationale**: Centralizes session validation in one place; resolvers stay thin and delegate
  (Layering). Distinct error types satisfy the unauthorized-vs-forbidden distinction (FR-006/FR-012).
  Reading the session and role per request satisfies FR-011/SC-006.
- **Alternatives considered**: Per-resolver session parsing (duplication); GraphQL schema directives
  (more machinery than two roles warrant — YAGNI).

## Decision 8 — Enforcing "own account only" for rent/return

- **Decision**: Keep the existing `addCarToCustomer` / `removeCarFromCustomer` GraphQL operations
  (rent / return) and add an ownership guard: the `customerId` argument MUST equal
  `context.currentCustomer.customerId`, otherwise `AuthorizationError` (forbidden).
- **Rationale**: Satisfies FR-010/SC-004 with a minimal, contract-preserving change. Avoids a
  broader schema redesign this iteration (KISS).
- **Alternatives considered**: New `rentCar(carId)` / `returnCar(carId)` mutations that infer the
  customer from the session (cleaner ubiquitous language, more secure-by-construction) — deferred to
  keep scope tight; noted as a future refinement.

## Decision 9 — Secrets configuration (constitution tension)

- **Decision**: Read **sensitive** values — `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET` — from **environment variables** via a typed `src/config/secrets.ts`
  accessor. Non-secret values (auth base URL, seed-admin email, paths) remain in
  `src/config/config.ts`.
- **Rationale**: The constitution says config is hardcoded with no `.env`. OAuth client secrets and
  the auth signing secret are credentials; committing them to `config.ts` is a security
  vulnerability. Environment variables are the standard secure mechanism. This is a justified,
  scoped deviation (recorded in Complexity Tracking), not a wholesale move to `.env`.
- **Alternatives considered**: Hardcoding secrets in `config.ts` (rejected — leaks credentials into
  version control); a secrets manager (over-engineered for local/dev scope).

## Decision 10 — Required GraphQL schema changes

- **Decision**: Update `src/typeDefs.ts` and regenerate types:
  - Add enum `CustomerRole { CUSTOMER ADMINISTRATOR }` and field `Customer.role: CustomerRole!`.
  - Relax Google-unprovided profile fields to nullable: `firstName: String`, `lastName: String`,
    `age: Int` (email stays required). Satisfies FR-013.
  - Add mutation `grantAdministratorRole(customerId: ID!): Customer` (admin-only) for FR-008.
- **Rationale**: Schema-first is mandatory (Principle II); types must be regenerated, never
  hand-edited. Nullable profile fields let Google-provisioned customers be valid without age, etc.
- **Alternatives considered**: Keeping `age: Int!` non-null (breaks for Google accounts that lack
  age); storing role only in the auth library (fails Decision 5).

## Summary of new dependencies

| Package | Purpose |
|---------|---------|
| `better-auth` | Authentication, Google provider, bearer plugin, mongodb adapter (types bundled) |
| `mongodb` (native driver) | Provide the `Db` instance to `mongodbAdapter` (already transitively present via Mongoose; add explicitly for typing) |
