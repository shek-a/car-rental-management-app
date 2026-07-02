# Feature Specification: Fleet Details & Rental Flow (Prototype)

**Feature Branch**: `feature/fleet-details-and-rental-flow`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "Make the backend support the Rove web-UI prototype end-to-end for a
stakeholder demo (no payments, no admin reports/analytics). Add richer car detail fields (plate,
year, seats, transmission, fuel, colour), a fleet status (available / leased / due soon / overdue)
derived from whether a car is rented and its return date, and capture a rental period when a customer
rents a car. Renting/returning stay own-account-only; car management stays admin-only. Also allow a
browser web app on a different origin to connect, and make the base URL configurable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse cars with real details and status (Priority: P1)

A visitor browsing the public catalogue sees each car's full details — make, model, year, body type,
colour, seats, transmission, fuel, licence plate, daily price, photo — and its current fleet status
(available, leased, due soon, or overdue). Statuses can be used to filter and to show badges.

**Why this priority**: The catalogue and car-detail screens are the front door of the demo and depend
on these fields and the status existing; nothing else is worth showing if the cars look empty.

**Independent Test**: Query the catalogue and a single car without signing in; confirm all detail
fields and a status value are returned, and that an available car reads "available".

**Acceptance Scenarios**:

1. **Given** cars exist in the fleet, **When** anyone views the catalogue or a single car, **Then**
   each car returns its plate, year, seats, transmission, fuel, colour (in addition to the existing
   make, model, type, cost-per-day, and photo) and a fleet status.
2. **Given** a car that is not rented, **When** anyone views it, **Then** its status is "available".
3. **Given** a car with no value yet for a new detail field, **When** anyone views it, **Then** the
   field is returned as empty rather than causing an error.

---

### User Story 2 - Rent a car for a period and see it as an active rental (Priority: P1)

An authenticated customer rents an available car for a rental period (a start and a due-back date).
The car is then associated with that customer, its status becomes "leased" (or "due soon" / "overdue"
as the due date approaches or passes), and it appears in the customer's active rentals showing when
it's due back. A customer can only rent to their own account.

**Why this priority**: Renting is the core revenue journey of the product and the reason the
catalogue exists; it must work end-to-end for the demo.

**Independent Test**: As an authenticated customer, rent an available car with a due date; confirm the
car is now associated with the customer, has a rental period, and reports a leased/due status; confirm
an unauthenticated or wrong-account attempt is rejected.

**Acceptance Scenarios**:

1. **Given** an authenticated customer and an available car, **When** they rent it for a period,
   **Then** the car is associated with that customer, records a start date and a due-back date, and
   its status becomes "leased".
2. **Given** a rented car whose due-back date is near, **When** anyone views it, **Then** its status
   is "due soon"; **and** when the due-back date has passed, its status is "overdue".
3. **Given** an unauthenticated request, **When** it attempts to rent, **Then** it is rejected as
   unauthorized.
4. **Given** an authenticated customer, **When** they attempt to rent to a different customer's
   account, **Then** it is rejected as forbidden.
5. **Given** a car that is already leased, **When** a customer attempts to rent it, **Then** the
   request is rejected.
6. **Given** an authenticated customer, **When** they view their rentals, **Then** they see the cars
   they currently hold, each with its due-back date.

---

### User Story 3 - Return a car and free it (Priority: P1)

An authenticated customer returns a car they hold. The rental period is cleared, the car is no longer
associated with them, and its status returns to "available" so it can be rented again.

**Why this priority**: Without return, the demo can only rent once; return closes the loop and resets
state between demo runs.

**Independent Test**: Return a held car; confirm it is freed, its status is "available", and it no
longer appears in the customer's rentals.

**Acceptance Scenarios**:

1. **Given** a customer holding a car, **When** they return it, **Then** the car is freed, its rental
   period is cleared, and its status becomes "available".
2. **Given** an authenticated customer, **When** they attempt to return a car that is not theirs,
   **Then** it is rejected as forbidden.
3. **Given** a returned car, **When** anyone views the customer's rentals, **Then** the car no longer
   appears there.

---

### User Story 4 - Administrator manages full car details (Priority: P2)

An administrator creates and edits cars with the full set of detail fields (plate, year, seats,
transmission, fuel, colour, plus the existing make/model/type/price and photo). Car management stays
administrator-only.

**Why this priority**: The admin console's fleet table and car editor need to write these fields, but
the customer-facing demo can be shown first with seeded data.

**Independent Test**: As an administrator, create a car with the full field set and edit it; confirm
the values persist and are returned when the car is viewed. Confirm a non-admin is rejected.

**Acceptance Scenarios**:

1. **Given** an administrator, **When** they create or update a car with the detail fields, **Then**
   the values are stored and returned on subsequent reads.
2. **Given** an authenticated non-administrator, **When** they attempt to create, update, or delete a
   car, **Then** the request is rejected as forbidden.
3. **Given** an unauthenticated request, **When** it attempts to create, update, or delete a car,
   **Then** it is rejected as unauthorized.

---

### User Story 5 - A browser web app on another origin can connect (Priority: P1)

The Rove web app, served from a different origin than the API, can call the API and load car photos
from the browser without being blocked, and the API's public address can be configured for the
environment it runs in.

**Why this priority**: Without cross-origin access the demo web app cannot talk to the backend at all;
this is a hard prerequisite for showing anything in a browser.

**Independent Test**: From a web page served on a different origin, make a request to the API and load
a photo; confirm neither is blocked by the browser. Change the configured base address and confirm
generated links (e.g. photo URLs) reflect it.

**Acceptance Scenarios**:

1. **Given** the web app is served from an allowed origin different from the API, **When** it calls
   the API or requests a car photo, **Then** the browser permits the response.
2. **Given** the API is configured with a specific public base address, **When** a car photo URL is
   produced, **Then** it uses that configured address rather than a hardcoded one.

---

### Edge Cases

- What happens to a car's status the moment its due-back date passes? It MUST read "overdue" without
  any action being taken on it.
- What is the boundary between "leased" and "due soon"? A car reads "due soon" once its due-back date
  is within the next 2 days (see FR-005).
- What happens when a customer provides a due-back date in the past (or now)? The rent request MUST be
  rejected; the due-back date must be in the future (see FR-007).
- What happens when an administrator sets or changes a car's detail fields on a car that is currently
  rented? The rental period and status are unaffected; only the detail fields change.
- What happens when a car has no photo but has all other details? It still returns its details and a
  placeholder-eligible null photo (unchanged from today).
- What happens to existing cars created before these fields existed? They remain valid; missing detail
  fields read as empty and their status is derived from their rented state.
- What happens if a request comes from an origin that is not allowed? The browser blocks it; this is
  expected and not a server error.

## Requirements *(mandatory)*

### Functional Requirements

#### Car details

- **FR-001**: The system MUST store and return, for each car, the following detail fields in addition
  to the existing make, model, type, cost-per-day, and photo: **licence plate, year, number of seats,
  transmission, fuel type, and colour**.
- **FR-002**: The system MUST treat the new detail fields as optional, so that cars created before this
  feature (and cars an administrator has not fully filled in) remain valid and are returned with empty
  values rather than errors.
- **FR-003**: The system MUST allow administrators to set and change all detail fields when creating or
  updating a car; these operations remain administrator-only.

#### Fleet status

- **FR-004**: The system MUST expose, for every car, a fleet status that is one of: **available**,
  **leased**, **due soon**, or **overdue**.
- **FR-005**: The system MUST derive the status from the car's rented state and its due-back date:
  not rented → "available"; rented with a due date more than **2 days** in the future → "leased";
  rented with a due date within the next **2 days** → "due soon"; rented with a due date in the past →
  "overdue". (The "due soon" window is 2 days.)
- **FR-006**: The system MUST compute status at read time so that a car becomes "due soon" and then
  "overdue" as time passes, with no explicit action required.

#### Renting for a period

- **FR-007**: The system MUST allow an authenticated customer to rent an available car by providing a
  **due-back date**; the system sets the **start date** to the time of renting. The captured rental
  period is this start date and the customer-provided due-back date. The due-back date MUST be in the
  future.
- **FR-008**: The system MUST restrict renting and returning to the authenticated customer acting on
  their own account; other-account attempts are rejected as forbidden and unauthenticated attempts as
  unauthorized.
- **FR-009**: The system MUST reject renting a car that is already leased.
- **FR-010**: The system MUST let an authenticated customer view the cars they currently hold, each
  with its due-back date.
- **FR-011**: The system MUST allow an authenticated customer to return a car they hold, which clears
  the rental period, frees the car, and returns its status to "available".

#### Browser access

- **FR-012**: The system MUST allow a browser-based web app served from a configured, allowed origin
  (different from the API's origin) to call the API and load car photos without the browser blocking
  the responses.
- **FR-013**: The system MUST allow the API's public base address to be configured per environment, so
  that generated links (such as car photo URLs) and the sign-in flow use the correct address rather
  than a hardcoded local one.

### Key Entities *(include if data involved)*

- **Car**: The existing fleet entity, extended with detail fields (plate, year, seats, transmission,
  fuel, colour) and a **rental period** (start date and due-back date) that is present while the car is
  rented and absent when it is available. Its fleet status is derived, not stored.
- **Fleet status**: A derived value describing a car's current state — available, leased, due soon, or
  overdue — computed from whether the car is rented and its due-back date.
- **Rental period**: The start date and due-back date captured when a customer rents a car; cleared on
  return. (Only the current/active period is tracked; historical past rentals are out of scope.)
- **Customer / Administrator**: Unchanged roles from the existing platform; renting is own-account-only
  and car management is administrator-only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of cars returned by the catalogue include all detail fields (plate, year, seats,
  transmission, fuel, colour) and a fleet status value.
- **SC-002**: A customer can rent an available car for a period and immediately see it in their active
  rentals with a due-back date, in a single session.
- **SC-003**: A car's status correctly reads "available" before renting, "leased" (or "due soon" /
  "overdue" per the due date) while rented, and "available" again after return — verifiable without any
  manual status change.
- **SC-004**: 100% of rent/return attempts by a non-owner or unauthenticated caller are rejected, and
  100% of car create/update/delete attempts by non-administrators are rejected.
- **SC-005**: The demo web app, served from a different origin, can complete browse → rent → view
  rentals → return entirely from the browser without cross-origin blocking.
- **SC-006**: Pointing the API at a different configured base address changes the car photo URLs it
  returns accordingly, with no code change.

## Assumptions

- This feature makes the backend sufficient for a **prototype demo**; production concerns beyond the
  listed scope are not addressed here.
- **Payments and pricing totals are out of scope** — cars carry a daily price only; any totals, fees,
  or charges shown in the UI are presentational and not produced or stored by the backend.
- **The admin Reports/analytics screen is out of scope** — no revenue, utilisation, or aggregation
  data is produced.
- **Only the active rental is tracked** — there is no persisted history of past/completed rentals; the
  "past trips" area of the UI is out of scope for this iteration.
- **One photo per car** remains the model; multiple photos / galleries are out of scope.
- **Authentication stays Google-only** — no additional sign-in methods and no third "fleet manager"
  role are added; the two existing roles (Customer, Administrator) are unchanged.
- The rental period is specified by the customer providing a **due-back date** (start date is set to
  the time of renting), and the **"due soon" window is 2 days** before the due-back date (both
  confirmed with the user).
- Detail-field value sets (e.g. transmission and fuel options) follow common real-world values; the
  backend stores them without constraining the UI to a fixed list unless clarified otherwise.
