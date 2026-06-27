# Feature Specification: User Authentication & Authorization

**Feature Branch**: `001-user-authentication`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "I want to implement authentication where users can sign up to the platform to rent cars (graphql endpoints are already there). There also be admin users who can create cars / delete cars (graphql endpoints are already there). I don't want to manage users and passwords (i.e. I don't want to be maintaining a table of users and passwords). I want to leverage an open source authentication library, where users can sign up using their Google account credentials (note that in the future I will add a front end, but that's not the scope of this task)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign up and sign in with a Google account (Priority: P1)

A prospective customer comes to the platform and authenticates using their existing Google
account. No new username or password is created on the platform — the customer proves their
identity through Google. On first sign-in, the platform recognizes them as a new customer and
establishes their account; on subsequent sign-ins, it recognizes the returning customer.

**Why this priority**: Without identity, no other protected capability can exist. This is the
foundation the whole feature rests on and delivers the core promise — letting people onto the
platform without the business storing passwords.

**Independent Test**: Authenticate as a brand-new Google identity and confirm an active,
authenticated session is established and a corresponding customer account exists. Authenticate
again with the same identity and confirm the same account is reused (no duplicate).

**Acceptance Scenarios**:

1. **Given** a person with a valid Google account who has never used the platform, **When** they
   complete the Google sign-in flow, **Then** an authenticated session is established and a new
   customer account is associated with their Google identity.
2. **Given** a returning customer who previously signed in with Google, **When** they sign in
   again, **Then** the same customer account is reused and no duplicate account is created.
3. **Given** a person who abandons or fails the Google sign-in flow, **When** the flow does not
   complete, **Then** no account is created and no authenticated session is established.

---

### User Story 2 - Authenticated customer rents and returns cars (Priority: P1)

An authenticated customer browses the available cars, rents one (associating it with their own
account), and later returns it. A customer may only act on their own rentals — they cannot rent
or return cars on behalf of another customer.

**Why this priority**: This is the primary revenue-generating journey and the reason customers
sign up. It proves that authentication is correctly wired to the existing rental operations.

**Independent Test**: As an authenticated customer, rent an available car, confirm it is
associated with that customer, then return it. Attempt the same operation while unauthenticated
and confirm it is rejected.

**Acceptance Scenarios**:

1. **Given** an authenticated customer and an available car, **When** they rent the car, **Then**
   the car is associated with that customer's account.
2. **Given** an unauthenticated request, **When** it attempts to rent or return a car, **Then**
   the request is rejected as unauthorized.
3. **Given** an authenticated customer, **When** they attempt to rent or return a car on behalf of
   a different customer's account, **Then** the request is rejected as forbidden.
4. **Given** an authenticated customer, **When** they view their rentals, **Then** they see only
   the cars associated with their own account.

---

### User Story 3 - Administrator manages the car fleet (Priority: P2)

An authenticated administrator adds new cars to the fleet and removes cars from it. Customers who
are not administrators cannot perform these fleet-management actions.

**Why this priority**: Fleet management is required for the platform to have inventory, but it is
operationally separate from the customer rental journey and can be delivered after the core
sign-in and rental flows work.

**Independent Test**: As an authenticated administrator, create a car and delete a car, confirming
both succeed. Attempt the same operations as an authenticated non-administrator customer and
confirm both are rejected.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator, **When** they create a new car, **Then** the car is
   added to the fleet.
2. **Given** an authenticated administrator, **When** they delete a car, **Then** the car is
   removed from the fleet.
3. **Given** an authenticated customer who is not an administrator, **When** they attempt to create
   or delete a car, **Then** the request is rejected as forbidden.
4. **Given** an unauthenticated request, **When** it attempts to create or delete a car, **Then**
   the request is rejected as unauthorized.

---

### Edge Cases

- What happens when an authenticated session expires mid-use? The next protected request MUST be
  rejected as unauthorized, prompting re-authentication.
- What happens when a Google identity returns an email that already belongs to an existing customer
  account? The system MUST link to the existing account rather than create a duplicate.
- What happens when an administrator's privileges are revoked while they hold an active session?
  Subsequent privileged actions MUST be evaluated against current privileges, not those held when
  the session began.
- What happens when a non-administrator attempts a privileged action? It MUST be rejected as
  forbidden (authenticated but not authorized), distinct from an unauthorized (unauthenticated)
  rejection.
- What happens when a customer attempts to rent a car that is already rented? The request MUST be
  rejected (existing rental rules continue to apply; authentication does not change them).

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication

- **FR-001**: The system MUST allow a person to authenticate using their existing Google account
  credentials, without the platform creating or storing a platform-specific password.
- **FR-002**: The system MUST NOT store or manage user passwords. Credential verification is
  delegated entirely to the external identity provider (Google).
- **FR-003**: On a person's first successful authentication, the system MUST establish a customer
  account associated with their verified Google identity.
- **FR-004**: On subsequent authentications by the same Google identity, the system MUST reuse the
  existing account and MUST NOT create a duplicate.
- **FR-005**: The system MUST establish an authenticated session upon successful sign-in that can
  be presented by an API client on subsequent requests to prove identity.
- **FR-006**: The system MUST reject requests presenting an expired, invalid, or absent session
  when accessing a protected operation, identifying them as unauthorized.

#### Authorization

- **FR-007**: The system MUST distinguish between two roles: **Customer** (can rent and return
  cars) and **Administrator** (can manage the car fleet).
- **FR-008**: The system MUST allow an existing administrator to grant the Administrator role to
  another account through a protected operation (no front end required). To bootstrap this, the
  system MUST recognize a single configured **seed administrator** — the account whose verified
  Google email is `andrew.shek23@gmail.com` — as an administrator on sign-in, so that the first
  administrator exists without any prior administrator having to grant it.
- **FR-009**: The system MUST restrict car-creation and car-deletion operations to administrators.
- **FR-010**: The system MUST restrict rent and return operations to authenticated customers, and
  MUST ensure a customer can only rent or return cars against their own account.
- **FR-011**: The system MUST evaluate a requester's current role at the time of each request, so
  that privilege changes take effect without requiring the session to be re-established.
- **FR-012**: The system MUST reject an authenticated requester who lacks the required role as
  forbidden, distinct from the unauthorized rejection used for unauthenticated requests.

#### Account & Profile

- **FR-013**: When establishing a new customer account from a Google identity, the system MUST
  capture the customer's verified email and, where available from the identity provider, their
  name. Profile attributes that Google does not provide (e.g. age) MUST be treated as optional for
  accounts created via Google sign-in, so that an account is valid and able to rent without them;
  the customer MAY supply them later.
- **FR-014**: The system MUST associate every rental with the authenticated customer who performed
  it, so that ownership of a rental is unambiguous.

#### Access Scope of Existing Operations

- **FR-015**: The system MUST treat the existing rent, return, car-create, and car-delete
  operations as protected, applying the authorization rules above.
- **FR-016**: The system MUST allow browsing of the car catalogue (viewing available cars) by
  unauthenticated visitors. Only the rent, return, car-create, and car-delete operations are
  protected; reading car data is public.

### Key Entities *(include if feature involves data)*

- **Identity**: A verified external identity provided by Google (e.g. a stable identifier and a
  verified email). The platform relies on it for authentication but does not own the credentials.
- **Customer Account**: The platform's representation of a person who can rent cars. Linked
  one-to-one to a Google identity. Carries the customer's role(s). Corresponds to the existing
  Customer concept in the domain.
- **Session**: A time-bounded, authenticated context established after successful sign-in, presented
  by an API client to access protected operations.
- **Role**: The authorization level of an account — Customer or Administrator — determining which
  operations the account may perform. The seed administrator (`andrew.shek23@gmail.com`) holds the
  Administrator role by configuration; other administrators are granted the role by an existing
  administrator.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can go from "never used the platform" to "authenticated with an active
  account" using only their Google account, with zero platform passwords created.
- **SC-002**: 100% of rent, return, car-create, and car-delete requests that lack a valid session
  are rejected as unauthorized.
- **SC-003**: 100% of car-create and car-delete requests made by non-administrators are rejected as
  forbidden.
- **SC-004**: 100% of attempts by a customer to rent or return a car against another customer's
  account are rejected.
- **SC-005**: A returning customer signing in with the same Google identity always resolves to a
  single account — zero duplicate accounts are created across repeated sign-ins.
- **SC-006**: Revoking a customer's administrator role takes effect on their next request without
  requiring them to sign out and back in.

## Assumptions

- The existing GraphQL operations for renting/returning cars and creating/deleting cars are the
  operations being protected; this feature adds an authentication and authorization layer rather
  than new business operations.
- Google is the only identity provider in scope for this iteration. Additional providers are out of
  scope.
- No front end is in scope. The feature is exercised by API clients that present an authenticated
  session; the future front end will consume the same mechanism.
- An authenticated customer may act only on their own rentals; administrators are not, by default,
  also rental customers unless they also hold the customer role.
- The business accepts that an external identity provider (Google) is responsible for credential
  security and availability; if Google sign-in is unavailable, customers cannot authenticate.
- Existing rental business rules (e.g. a car already rented cannot be rented again) continue to
  apply unchanged; authentication does not alter them.
- Exactly one seed administrator is configured (`andrew.shek23@gmail.com`); all other
  administrators are promoted through the protected grant operation by an existing administrator.
- Reading car data is public; protecting reads is out of scope for this iteration.
- Profile attributes not supplied by Google (e.g. age) are optional and do not block renting.
