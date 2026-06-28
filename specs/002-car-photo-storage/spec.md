# Feature Specification: Car Photo Storage

**Feature Branch**: `feature/add-photo-storage`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "add photo storage for car images"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrator adds a photo to a car (Priority: P1)

An administrator managing the fleet attaches a photo to a car so that the car has a visual
representation. The photo becomes part of that car's record and is available whenever the car is
viewed. If the car already has a photo, adding a new one replaces it.

**Why this priority**: Without the ability to add photos, there is nothing to store or display —
this is the foundation the rest of the feature depends on.

**Independent Test**: As an administrator, add a photo to an existing car and confirm the photo is
associated with that car and retrievable. Confirm a non-administrator cannot add a photo.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator and an existing car, **When** they add a valid image to
   the car, **Then** the image is stored and associated with that car.
2. **Given** an administrator and a car that already has a photo, **When** they add a new valid
   image, **Then** the new image replaces the existing one (the car still has exactly one photo).
3. **Given** an authenticated non-administrator, **When** they attempt to add a photo to a car,
   **Then** the request is rejected as forbidden.
4. **Given** an unauthenticated request, **When** it attempts to add a photo, **Then** it is
   rejected as unauthorized.
5. **Given** an administrator, **When** they attempt to add a photo to a car that does not exist,
   **Then** the request is rejected with a clear "car not found" error.
6. **Given** an administrator, **When** they submit a file that is not a supported image or exceeds
   the size limit, **Then** the request is rejected with a clear validation error and nothing is
   stored.

---

### User Story 2 - Anyone viewing a car sees its photo (Priority: P1)

A visitor or customer browsing the catalogue views a car and sees its photo, so they can see what
they are considering renting.

**Why this priority**: A photo only delivers value once it can be seen; this is the consumer side of
the same core capability and pairs with US1 to form the MVP.

**Independent Test**: For a car that has a photo, retrieve the car (or its photo) without
authentication and confirm the photo is returned. For a car with no photo, confirm an empty result
(not an error).

**Acceptance Scenarios**:

1. **Given** a car that has a photo, **When** anyone views that car, **Then** its photo is
   returned/visible without requiring authentication.
2. **Given** a car that has no photo, **When** anyone views that car, **Then** the car is returned
   normally with no photo (an empty value, not an error).
3. **Given** a request for the photo of a car that does not exist, **When** it is made, **Then** a
   clear "car not found" result is returned.

---

### User Story 3 - Administrator removes a car's photo (Priority: P2)

An administrator removes a photo that is outdated, incorrect, or no longer wanted, so the car's
imagery stays accurate.

**Why this priority**: Keeping imagery correct matters, but it is a maintenance action that can
follow the core add/view capability.

**Independent Test**: As an administrator, remove a specific photo from a car and confirm it is no
longer associated with the car or retrievable. Confirm a non-administrator cannot remove a photo.

**Acceptance Scenarios**:

1. **Given** an administrator and a car with a photo, **When** they remove that photo, **Then** the
   photo is no longer associated with the car and is no longer retrievable.
2. **Given** an authenticated non-administrator, **When** they attempt to remove a photo, **Then**
   the request is rejected as forbidden.
3. **Given** an administrator, **When** they attempt to remove a photo that does not exist, **Then**
   the request is rejected with a clear "photo not found" error.

---

### Edge Cases

- What happens to a car's photo when the car itself is deleted? The photo MUST be removed so no
  orphaned image remains.
- What happens when a photo is added to a car that already has one? The new photo MUST replace the
  existing one; the car still has exactly one photo — see FR-008.
- What happens when an upload is interrupted or fails midway? No partial or unusable photo may be
  associated with the car, and any pre-existing photo MUST remain intact.
- What happens when an unsupported file type (e.g. a document or video) is submitted? It MUST be
  rejected as a validation error and any pre-existing photo MUST remain intact.

## Requirements *(mandatory)*

### Functional Requirements

#### Managing photos

- **FR-001**: The system MUST allow an administrator to add a photo to an existing car.
- **FR-002**: The system MUST restrict adding and removing a car's photo to administrators;
  authenticated non-administrators MUST be rejected as forbidden and unauthenticated requests as
  unauthorized.
- **FR-003**: The system MUST associate a stored photo with exactly one car.
- **FR-004**: The system MUST allow an administrator to remove a car's photo.
- **FR-005**: The system MUST remove a car's photo when that car is deleted, leaving no orphaned
  image.

#### Viewing the photo

- **FR-006**: The system MUST allow anyone (including unauthenticated visitors) to view a car's
  photo, consistent with car catalogue reads being public.
- **FR-007**: The system MUST return a car with no photo (an empty value, not an error) when the car
  has none.

#### Storage scope per car

- **FR-008**: The system MUST support storing at most one photo per car. Adding a photo to a car
  that already has one MUST replace the existing photo.

#### Validation & limits

- **FR-009**: The system MUST validate that an uploaded file is a supported image format (JPEG, PNG,
  or WebP) and reject unsupported types with a clear error.
- **FR-010**: The system MUST enforce a maximum size per photo (a sensible default set during
  planning), rejecting submissions that exceed it.
- **FR-011**: The system MUST ensure a failed, interrupted, or rejected upload does not leave a
  partial or unusable photo associated with the car, and does not destroy any pre-existing photo.

### Key Entities *(include if data involved)*

- **Car Photo**: An image associated with a single car. Conceptual attributes: the car it belongs
  to, the image content (or a reference to where the content is stored), its format, and metadata
  such as when it was added.
- **Car**: The existing fleet entity. Gains an association to zero or one Car Photo. Otherwise
  unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can add a photo to a car and immediately retrieve it on the car in a
  single session.
- **SC-002**: 100% of photo add/remove requests from non-administrators are rejected (forbidden if
  authenticated, unauthorized if not).
- **SC-003**: 100% of submissions with an unsupported file type or one exceeding the size limit are
  rejected and result in no stored photo, with any pre-existing photo left intact.
- **SC-004**: When a car is deleted, its photo is removed (zero orphaned images remain).
- **SC-005**: Anyone viewing a car with a photo can see it without signing in; viewing a car with no
  photo never produces an error.

## Assumptions

- Photo **management** (add/replace/remove) is a fleet-management action and is therefore restricted
  to administrators, consistent with the existing create/delete-car rules.
- Photo **viewing** is public, consistent with the existing rule that reading car data is public.
- A photo is an optional attribute of a car: a car can exist with no photo, and creating a car does
  not require one. Each car has at most one photo (adding replaces).
- Supported image formats are JPEG, PNG, and WebP; the exact per-photo size limit is set to a
  sensible default during planning (e.g. ~5 MB).
- Photos are provided by API clients (no front end in scope this iteration); a future front end will
  consume the same capability.
- Customer/personal photos are out of scope — this feature concerns car images only.
