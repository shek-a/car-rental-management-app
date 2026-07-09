# Data Model: Car Availability Search (Location + Date Range)

**Feature**: `004-car-availability-search` | **Date**: 2026-07-09

No new collections. One additive field on `Car`, one new value object, one new value-object
behavior, and one derived predicate. Everything else is reuse of feature 003's rental domain.

## Car (existing entity — delta only)

| Field | Type | Notes |
|---|---|---|
| `location` | `string`, optional | **NEW.** The place where the car is picked up and returned, stored trimmed in its original casing (for display). Absent on legacy cars until an administrator records one. Never blank when present (Location value object enforces). |

- Persisted in `carSchema` (`src/model/car.ts`) as an optional `String` — additive, no migration,
  no backfill (spec assumption).
- Written only through `createCar` / `updateCar` (admin-guarded, FR-008). No clear operation —
  an explicit `location: null` on update is rejected (a location can be changed, not removed;
  passing it through would let Mongoose silently unset the field).
- **Matching rule** (FR-002/FR-003): a car matches a searched location iff `location` is present
  and equals the searched value case-insensitively after trimming both sides. Implemented with
  Mongo collation `{ locale: "en", strength: 2 }` in `carRepository.findByLocation` (research D5).

## Location (new value object — `src/domain/car/location.ts`)

Identity-less; equality by value; immutable (frozen), mirroring `rentalPeriod.ts`.

- **Creation invariant**: input is trimmed; a blank (empty/whitespace-only) location is rejected
  with a validation error (spec edge case).
- **Equality**: case-insensitive comparison of trimmed values — `"melbourne "` ≡ `"Melbourne"`.
- Used at both boundaries: validating `location` on the car mutations, and normalizing the
  searched location before it reaches the repository.

## RequestedRentalPeriod (reused value object)

The searcher's desired period **is** the existing `RentalPeriod` value object
(`src/domain/rental/rentalPeriod.ts`) — `{ leaseDate, dueBackDate }`, immutable, built via the
existing `createRentalPeriod` factory.

- **Validation** (FR-007, inherited): dates must be valid; `dueBackDate` strictly after
  `leaseDate`. Violations surface as a GraphQL validation error (User Story 3).
- No new "search period" type is introduced — one vocabulary, one invariant (research D2).

## periodsOverlap (new value-object behavior — `rentalPeriod.ts`)

`periodsOverlap(a: RentalPeriod, b: RentalPeriod): boolean` — **inclusive** interval overlap at
**calendar-day granularity (UTC)**. Stored rentals carry times of day (`leaseDate` is
`new Date()` at rent time), so both periods' dates are truncated to their UTC calendar date
before comparing:

```
overlap ⟺ day(a.leaseDate) ≤ day(b.dueBackDate) AND day(b.leaseDate) ≤ day(a.dueBackDate)
          where day(d) = d truncated to its UTC calendar date
```

Inclusive boundaries encode "no same-day turnaround" (spec edge case): a request picking up on the
day an existing rental is due back **overlaps**, whatever the times of day.

| Current rental | Requested period | Overlap? |
|---|---|---|
| Jul 1 → Jul 20 | Jul 15 → Jul 18 | yes (contained) |
| Jul 1 → Jul 20 | Jul 18 → Jul 25 | yes (partial) |
| Jul 1 → Jul 20 | **Jul 20** → Jul 25 | yes (boundary day) |
| Jul 1 → Jul 20 **00:00** | Jul 20 **15:00** → Jul 25 | yes (same calendar day — times ignored) |
| Jul 1 → Jul 20 | Jul 21 → Jul 25 | no |

## Availability (derived — never stored)

`isAvailableForPeriod(rentalPeriod: RentalPeriod | null, requestedPeriod: RentalPeriod, now: Date): boolean`
in `carAvailabilityService.ts` (named predicate per the coding standards):

1. No current rental period → **available** (FR-004).
2. `deriveFleetStatus(rentalPeriod, now) === OVERDUE` → **unavailable** for every requested period
   (FR-006) — the car is still out and its true return date is unknown.
3. Otherwise → available iff **not** `periodsOverlap(rentalPeriod, requestedPeriod)` (FR-005).

`searchAvailableCars(location, requestedPeriod, now)` = `findByLocation(location)` filtered by
this predicate. `now` is a parameter (as in `deriveFleetStatus`) so the rule is deterministic
under test.

## State transitions

None. `location` is a plain attribute edit through existing mutations; availability and fleet
status remain derived read-time values with no stored state.

## Relationships (unchanged)

`Customer 1 ── * Car` rental relationship is untouched; search reads the car's existing
`leasedDate`/`returnDate` projection (its current `RentalPeriod`) and its new `location`.
