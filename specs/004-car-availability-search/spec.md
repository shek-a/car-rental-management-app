# Feature Specification: Car Availability Search (Location + Date Range)

**Feature Branch**: `feature/car-availability-search`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "The Rove web front end's catalogue hero has a location + date-range
search bar that is currently descoped because the backend has no search API (see the web app's
`docs/user-stories.md` → Descoped design elements). Make this backend support it: customers search
for cars by a location and a requested rental period, and get back only the cars that are at that
location and available for the whole period. Plan using domain-driven design."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search available cars by location and dates (Priority: P1)

A visitor on the public catalogue types a location and picks a rental date range (pickup and
due-back) in the hero search bar. The catalogue then shows only the cars that are at that location
and free for the entire requested period, rendered with the same details (make, model, photo,
price, status) as the ordinary catalogue grid.

**Why this priority**: This is the entire feature — the hero search bar has no backing capability
today and is the single descoped design element this feature exists to unblock.

**Independent Test**: Seed cars at two locations, one of them rented for a known period; search
without signing in and confirm only the free car at the searched location is returned.

**Acceptance Scenarios**:

1. **Given** a car at "Melbourne" with no current rental, **When** anyone searches Melbourne for
   any valid period, **Then** the car appears in the results.
2. **Given** a car at "Melbourne" rented with a due-back date of Jul 20, **When** anyone searches
   Melbourne for Jul 15 – Jul 18, **Then** the car does not appear.
3. **Given** the same rented car (due back Jul 20), **When** anyone searches Melbourne for
   Jul 25 – Jul 28, **Then** the car appears (its rental does not overlap the request).
4. **Given** a car at "Sydney", **When** anyone searches Melbourne, **Then** the Sydney car does
   not appear regardless of dates.
5. **Given** a search that matches no cars, **When** it runs, **Then** an empty list is returned
   (not an error).
6. **Given** results are returned, **Then** each car carries the same fields the catalogue grid
   already renders (details, photo, fleet status) with no extra lookups needed.

---

### User Story 2 - Record where a car is located (Priority: P2)

An administrator records a car's location when adding it to the fleet, or corrects it later when
the car is moved, so that the car becomes searchable at that location.

**Why this priority**: Search is only as good as its data — without a way to capture location,
Story 1 can never return anything. Still P2 because seeding data directly also proves Story 1.

**Independent Test**: As an administrator, create a car with a location and update another car's
location; confirm the location comes back (trimmed) from the existing single-car query — no search
required. With Story 1 in place, additionally confirm searches find cars only at their current
location.

**Acceptance Scenarios**:

1. **Given** an administrator creating a car with location "Melbourne", **When** anyone searches
   Melbourne, **Then** the new car appears.
2. **Given** a car located at "Melbourne", **When** an administrator updates its location to
   "Sydney", **Then** it appears in Sydney searches and no longer in Melbourne searches.
3. **Given** a car created before this feature (no recorded location), **When** anyone searches any
   location, **Then** that car never appears — but it still appears in the plain catalogue listing.
4. **Given** a location differing only in letter case or surrounding spaces (" melbourne "),
   **When** it is searched, **Then** it matches cars located at "Melbourne".

---

### User Story 3 - Invalid searches are rejected clearly (Priority: P3)

A visitor who submits a nonsensical search — a due-back date on or before the pickup date,
unreadable dates, or a blank location — receives a clear validation error rather than an empty or
misleading result.

**Why this priority**: Protects trust in the results, but the web app's date picker makes this a
rare path.

**Acceptance Scenarios**:

1. **Given** a search with due-back date equal to or before the pickup date, **When** it is
   submitted, **Then** the system rejects it with a message explaining the period is invalid.
2. **Given** a search with an unparseable date, **When** it is submitted, **Then** the system
   rejects it with a validation error and returns no result set.
3. **Given** a search with a blank (empty or whitespace-only) location, **When** it is submitted,
   **Then** the system rejects it with a validation error.

---

### Edge Cases

- **Boundary day**: a request whose pickup date falls on the same **calendar day (UTC)** as an
  existing rental's due-back date is a conflict — same-day turnaround is not offered, so the car
  is excluded regardless of the time of day either date carries.
- **Overdue car**: a car held past its due-back date has no known return date, so it is excluded
  from every search — even for periods after its (already passed) due-back date.
- **Blank location on a car**: providing an empty or whitespace-only location when creating or
  updating a car is rejected as invalid input. Explicitly setting a car's location to null on
  update is likewise rejected — a location can be changed but not removed.
- **No cars at the searched location**: returns an empty list, not an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let anyone, without signing in, search cars by a location and a
  requested rental period (pickup date and due-back date) in a single request.
- **FR-002**: A search MUST return only cars whose recorded location matches the searched location,
  ignoring letter case and surrounding whitespace.
- **FR-003**: A car with no recorded location MUST never appear in location searches, while
  remaining visible in the plain catalogue listing.
- **FR-004**: A car with no current rental MUST be treated as available for any valid requested
  period.
- **FR-005**: A car whose current rental period overlaps the requested period MUST be excluded
  from the results. Overlap is judged at calendar-day granularity (UTC): sharing a boundary day —
  even at different times of day — is a conflict.
- **FR-006**: A car that is overdue (still out past its due-back date) MUST be excluded from all
  searches regardless of the requested period.
- **FR-007**: A requested period whose due-back date is not after its pickup date, or whose dates
  are unreadable, MUST be rejected with a validation error — as MUST a blank (empty or
  whitespace-only) searched location.
- **FR-008**: Administrators MUST be able to record a car's location when creating a car and change
  it when updating a car, under the same access rules as the existing car management operations.
- **FR-009**: Search results MUST carry the same car information as the existing catalogue listing
  (details, photo, derived fleet status) so the catalogue grid renders identically.
- **FR-010**: A search matching no cars MUST return an empty result, not an error.

### Key Entities

- **Car**: existing entity; gains a **location** — the place where the car is picked up and
  returned. Optional (legacy cars have none until staff record one).
- **Location**: a value — a normalized place name (trimmed, compared case-insensitively). No
  identity of its own; two equal names are the same location.
- **Requested rental period**: the searcher's desired pickup and due-back dates — the same rental
  period concept the domain already uses for active rentals (lease date / due-back date), reused
  with the same validity rule (due-back after lease).
- **Availability**: derived, never stored — a car is available for a requested period when it has
  no current rental conflicting with it and is not overdue.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With a seeded fleet spanning two locations and mixed rental states, a search returns
  exactly the cars at the searched location that are free for the whole period — no false
  inclusions or exclusions across the acceptance scenarios above.
- **SC-002**: The web app's descoped "Location + date-range search bar" can be re-scoped: every
  hero-bar input (location, pickup date, due-back date) maps to one search parameter, and the
  response renders in the existing CarCard grid without additional requests.
- **SC-003**: A search completes in a single request/response round trip.
- **SC-004**: 100% of invalid-period searches are rejected with a validation message; none return a
  partial or misleading result set.

## Assumptions

- The hero search bar is free-text for location (per the design mock), so no location
  directory/typeahead endpoint is needed in this feature.
- Renting remains immediate-only (no future reservations exist in the system), so search evaluates
  availability against **current** rentals only; a result is advisory availability, not a hold or a
  booking.
- Same-day turnaround is not offered: a rental's due-back day and a request's pickup day may not be
  the same day.
- Searches dated in the past are not specially rejected; the web app's date picker prevents them.
- Cars created before this feature have no location and are simply absent from searches until an
  administrator records one; no backfill is required.
- Search is public (unauthenticated), consistent with the existing catalogue queries.
