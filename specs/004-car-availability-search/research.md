# Research: Car Availability Search (Location + Date Range)

**Feature**: `004-car-availability-search` | **Date**: 2026-07-09

Resolves the design unknowns. Guiding constraints: **Domain-Driven Design throughout** (the user
explicitly asked for the DDD skill to drive this plan), **reuse** the rental domain built in
feature 003 (`RentalPeriod`, `deriveFleetStatus`, `carRepository`), and keep to the **prototype
scope** the web app needs (one hero search bar; no reservations, no location directory).

## Decision 1 — `Location` as a normalized free-text value object on `Car`

- **Decision**: A car's location is a **`Location` value object** — a trimmed, non-blank place
  name, compared **case-insensitively**, persisted as a new optional `location` string field on the
  existing `Car` document. No new collection.
- **Rationale**: The design mock is a free-text input ("San Francisco, CA"), and a location has no
  identity or lifecycle of its own in this domain — two equal names are the same place, which is
  the definition of a value object. Optional keeps the change additive: legacy cars simply lack a
  location until staff record one.
- **Alternatives considered**: A `Location`/`Branch` **entity with its own collection** (rejected —
  nothing references locations independently; pure speculation, YAGNI); a GraphQL **enum**
  (rejected — adding a branch would require a schema change and redeploy).

## Decision 2 — Search contract speaks the existing rental language

- **Decision**: One new query, `searchAvailableCars(location: String!, requestedPeriod:
  RentalPeriodInput!): [Car!]!`, where `RentalPeriodInput` is `{ leaseDate: Date!, dueBackDate:
  Date! }` — the same names as the existing `RentalPeriod` type.
- **Rationale**: Ubiquitous language. The domain already calls this concept a *rental period* with
  a *lease date* and a *due-back date*; introducing `pickupDate`/`dropoffDate` synonyms at the API
  boundary would fork the vocabulary. The searcher's requested period **is** a `RentalPeriod` and
  reuses its invariant (due-back strictly after lease) via the existing `createRentalPeriod`
  factory, which also gives FR-007's validation for free.
- **Alternatives considered**: Loose `startDate`/`endDate` scalars (rejected — no value-object
  invariant, synonym vocabulary); making both filters optional (rejected — the hero bar always
  submits both; optional filters have murky availability semantics, YAGNI).

## Decision 3 — Availability = no overlap **and** not overdue, derived at read time

- **Decision**: A car is available for a requested period iff it has **no current rental period**,
  or its rental period does **not overlap** the requested one (inclusive of boundary days) **and**
  the car is not **OVERDUE**. Implemented as a pure predicate built from two pieces: a new
  value-object behavior `periodsOverlap(a, b)` in `rentalPeriod.ts`, and the existing
  `deriveFleetStatus(period, now)` for the overdue check. Nothing is stored.
- **Rationale**: Overlap alone is wrong for overdue cars — a car due back Jun 20 but never returned
  is still out, so a Jul search must not offer it; its true return date is unknown. Reusing
  `deriveFleetStatus` keeps one source of truth for "overdue" (feature 003's derived status)
  instead of re-deriving it with slightly different rules. Inclusive boundaries encode the "no
  same-day turnaround" business rule in one place.
- **Alternatives considered**: Overlap check only (rejected — offers overdue cars); a stored
  availability flag (rejected — same staleness problem feature 003 already rejected for status).

## Decision 4 — `CarAvailabilityService` domain service in `domain/rental/`

- **Decision**: A stateless **`carAvailabilityService`** with
  `searchAvailableCars(location, requestedPeriod, now)` that asks the repository for the cars at a
  location and filters them with the availability predicate (Decision 3). The resolver is thin:
  build the `Location` and `RentalPeriod` value objects from the input, delegate, return.
- **Rationale**: The operation spans many `Car` entities plus a searcher-supplied value object —
  it belongs to no single entity, which is exactly the Domain Service case in the DDD skill. It
  lives beside `carRentalService`/`fleetStatus` in `domain/rental/` because availability is a
  rental concern (it is defined entirely by rental periods and fleet status). Business rules stay
  out of the resolver per the constitution's layering principle.
- **Alternatives considered**: Logic in the resolver (rejected — constitution prohibits);
  `domain/car/` placement (rejected — nothing about availability is intrinsic to the car itself;
  it is a property of the rental relationship).

## Decision 5 — Repository filters location; the domain filters availability

- **Decision**: `carRepository` gains `findByLocation(location)` using a **case-insensitive
  collation** match on the stored `location` field ( `collation: { locale: "en", strength: 2 }` ).
  Date-overlap/overdue filtering happens **in the domain service**, not in the Mongo query.
- **Rationale**: Location match is structural ("give me the cars at this place") and belongs to the
  repository, which speaks domain language while owning persistence detail (collation). The
  availability rule is a business rule — pushing the overlap/overdue logic into a Mongo `$or`
  query would move domain logic into infrastructure, make it untestable without a database, and
  duplicate the overdue rule that `deriveFleetStatus` already owns. Prototype fleet sizes make
  in-memory filtering of one location's cars trivially cheap.
- **Alternatives considered**: Whole filter as one Mongo query (rejected — business rule leaks into
  infrastructure); lowercased shadow key (`locationKey`) column (rejected — collation does the same
  without denormalizing); regex `^…$/i` match (rejected — requires escaping user input; collation
  is equality-shaped and safer).

## Decision 6 — No reservations: availability is advisory, against current rentals only

- **Decision**: Search evaluates a car's **single current rental** (the system's only rental
  record). No booking/hold is created by searching; renting remains the immediate
  `addCarToCustomer` flow.
- **Rationale**: The backend has no future-reservation concept (feature 003 explicitly scoped
  rental history and booking out). Building one for a search bar would be a different, much larger
  feature. The spec records this as an assumption: a result means "free for that period as of
  now".
- **Alternatives considered**: A `Reservation` entity + calendar (rejected — out of scope, YAGNI
  until the product needs real bookings).

## Decision 7 — Location capture rides the existing car mutations

- **Decision**: `CreateCarInput` and `UpdateCarInput` gain an optional `location: String`. The
  `Location` value object validates it (trimmed, non-blank) at the boundary. No new mutation, no
  clear-location operation, no backfill of legacy cars.
- **Rationale**: Recording where a car is belongs to the existing admin car-management journeys and
  inherits their guards (FR-008). Legacy cars staying location-less is acceptable — they are simply
  absent from searches until edited (spec assumption).
- **Alternatives considered**: A dedicated `setCarLocation` mutation (rejected — no distinct
  actor/journey to justify it); required `location` on create (rejected — breaks existing clients
  and the additive-schema pattern used by features 002/003).

## Decision 8 — Public, unauthenticated search

- **Decision**: `searchAvailableCars` requires no session, exactly like the existing `cars` and
  `car` catalogue queries.
- **Rationale**: The hero search sits on the public catalogue (the web app's landing screen);
  feature 001/003 already established the catalogue as unauthenticated read access.
- **Alternatives considered**: Requiring sign-in (rejected — would break the design's public
  browse-first flow).

## Decision 9 — No location directory endpoint (deferred)

- **Decision**: Do **not** add a `carLocations`/distinct-locations query in this feature.
- **Rationale**: The design's location field is free text, not a select; nothing in the descoped
  element calls for a directory. YAGNI — trivially added later if the web app grows a typeahead.
- **Alternatives considered**: `carLocations: [String!]!` for a dropdown (deferred, not rejected —
  revisit if the design changes).
