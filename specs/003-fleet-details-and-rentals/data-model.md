# Data Model: Fleet Details & Rental Flow (Prototype)

**Feature**: `003-fleet-details-and-rentals` | **Date**: 2026-07-01

Modelled with Domain-Driven Design. The `Car` gains detail attributes and an optional `RentalPeriod`
value object; `FleetStatus` is a derived value object. Image bytes and photo metadata are unchanged
from feature 002.

## Ubiquitous language

| Term | Meaning |
|------|---------|
| **Car** | A fleet vehicle. Aggregate carrying its detail attributes and (while rented) a `RentalPeriod`. |
| **Customer** | A renter. Aggregate root for the rental relationship (holds the cars they currently rent). |
| **RentalPeriod** | Value object: the `leaseDate` (start) and `dueBackDate` for a car that is currently rented. |
| **FleetStatus** | Derived value: `AVAILABLE` · `LEASED` · `DUE_SOON` · `OVERDUE`. |
| **rent / return** | A customer rents a car for a period; returning frees it. |

## Value object: `RentalPeriod`

Immutable; equality by value. Present on a `Car` while rented, absent when available.

| Field | Type | Notes |
|-------|------|-------|
| `leaseDate` | Date | When renting occurred (set to "now" at rent time). |
| `dueBackDate` | Date | Customer-provided; MUST be in the future at rent time. |

**Persistence**: reuses the existing `Car.leasedDate` (→ `leaseDate`) and `Car.returnDate`
(→ `dueBackDate`) fields — no new storage. A `Car` is **rented iff it has a `RentalPeriod`**.

**Invariant**: `dueBackDate` must be strictly after `leaseDate` (and in the future when created).

## Value object: `FleetStatus` (derived, never stored)

Computed by a pure domain function `deriveFleetStatus(rentalPeriod | null, now)`:

```
no rentalPeriod                              → AVAILABLE
dueBackDate  >  now + DUE_SOON_WINDOW_DAYS    → LEASED
now  ≤  dueBackDate  ≤  now + 2 days          → DUE_SOON
dueBackDate  <  now                           → OVERDUE
```

`DUE_SOON_WINDOW_DAYS = 2` (named domain constant). Exposed via GraphQL as a non-null `FleetStatus`
enum on `Car`.

## Aggregate: `Car` (extended)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `carId` | ID | yes | Existing. |
| `make`, `model`, `type`, `costPerDay` | — | yes | Existing. |
| `photo` (`CarPhoto`) | — | no | Existing (feature 002). |
| `plate` | String | no | **New.** Licence plate. |
| `year` | Int | no | **New.** |
| `seats` | Int | no | **New.** |
| `transmission` | String | no | **New.** Free string (e.g. "Automatic"/"Manual"); UI not constrained. |
| `fuel` | String | no | **New.** e.g. "Petrol"/"Electric". |
| `colour` | String | no | **New.** |
| `rentalPeriod` | RentalPeriod | no | **New (derived from `leasedDate`/`returnDate`).** Null when available. |
| `status` | FleetStatus | yes | **New (derived).** Never stored. |
| `leasedDate`, `returnDate` | Date | no | Existing raw fields; retained for backward compatibility; now the storage backing `rentalPeriod`. |
| `customer` | Customer | no | Existing — the current renter (or null). |

**Invariants (enforced via the domain, not the resolver):**
- A car has **at most one** `RentalPeriod` at a time.
- A car can be rented only when it has no `RentalPeriod` (i.e. status `AVAILABLE`).
- Renting sets `customer` + `RentalPeriod` together; returning clears both together (kept consistent).

## Aggregate root: `Customer` (unchanged shape)

No new fields. Continues to hold `cars` (the cars the customer currently rents). Renting adds a car
to the customer and returning removes it — kept consistent with the car's `customer` link and
`RentalPeriod` by the domain service.

## Domain service: `CarRentalService`

Stateless; coordinates the `Customer` and `Car` aggregates through repositories.

| Operation | Behaviour |
|-----------|-----------|
| `rentCarToCustomer(carId, customerId, dueBackDate)` | Load car + customer; assert car exists, customer exists, car is `AVAILABLE`, customer doesn't already hold it, and `dueBackDate` is in the future; set the car's `RentalPeriod` (leaseDate = now, dueBackDate) and link car↔customer; persist. Returns the updated `Customer`. |
| `returnCarFromCustomer(carId, customerId)` | Assert the customer holds the car; clear the car's `RentalPeriod` and the car↔customer link; persist. Returns the updated `Customer`. |

Domain occurrences **modelled** (not dispatched this iteration): `CustomerRentedCar`,
`CustomerReturnedCar`.

## Repositories

- **`carRepository`** (extend): add `setRentalPeriod(carId, rentalPeriod, customerRef)` and
  `clearRentalPeriod(carId)` (or equivalent save of the Car aggregate) alongside existing
  `findByCarId` / photo methods. Hides Mongoose.
- **`customerRepository`** (reuse): load/save the customer and their held cars.

## State transitions

```
AVAILABLE ──rentCarToCustomer(dueBackDate future)──▶ LEASED
LEASED ──time passes (≤2 days to due)──▶ DUE_SOON ──time passes (past due)──▶ OVERDUE
LEASED / DUE_SOON / OVERDUE ──returnCarFromCustomer──▶ AVAILABLE
AVAILABLE ──rent with a past/invalid dueBackDate──▶ (rejected, unchanged)
```

## Mapping to functional requirements

| Requirement | Model element |
|-------------|---------------|
| FR-001/002/003 | `Car` detail fields (optional); admin create/update sets them |
| FR-004/005/006 | `FleetStatus` derived value + `deriveFleetStatus(period, now)` + `DUE_SOON_WINDOW_DAYS` |
| FR-007 | `RentalPeriod` (leaseDate=now, customer dueBackDate; future-dated) via `rentCarToCustomer` |
| FR-008 | existing `requireOwnAccount` guard on the rent/return resolvers |
| FR-009 | `rentCarToCustomer` rejects when car is not `AVAILABLE` |
| FR-010 | `Customer.cars` + each car's `rentalPeriod.dueBackDate` |
| FR-011 | `returnCarFromCustomer` clears the period and link |
| FR-012/013 | CORS/`trustedOrigins` + configurable base URL (infrastructure, see contracts) |
