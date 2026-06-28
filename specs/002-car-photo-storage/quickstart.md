# Quickstart & Validation: Car Photo Storage

**Feature**: `002-car-photo-storage`

Proves the feature works end-to-end. References [contracts/](./contracts/) and
[data-model.md](./data-model.md) rather than repeating them. Implementation belongs in `tasks.md`.

## Prerequisites

- Node.js, Yarn, Docker, and a running MongoDB (per project setup).
- Auth env vars set (from feature 001) so you can obtain an **administrator** session token — the
  seed admin `andrew.shek23@gmail.com`. Photo viewing needs no auth.
- No cloud account and no extra services: photos are stored locally under `PHOTO_STORAGE_DIR`.

## Setup

```bash
yarn
yarn generate-graphql-types          # after the schema delta
yarn start                           # http://localhost:8082
```

`PHOTO_STORAGE_DIR` (default `./.photo-storage`) is created on demand and is git-ignored.

## Automated tests (primary validation)

```bash
yarn test                                          # all unit tests (TDD)
yarn test -- --testPathPattern carPhotoValidation  # format + size validation
yarn test -- --testPathPattern carPhotoService     # store/replace/remove orchestration
yarn test:integration                              # local FS adapter + Mongo metadata round-trip
```

## Manual end-to-end scenarios

Obtain an admin bearer token first (feature 001 sign-in flow), then:

### Scenario A — Admin adds a photo (US1, SC-001)
1. With `Authorization: Bearer <admin token>`, call `addCarPhoto(carId, { data: <base64>, contentType: "image/png" })`.
2. **Expected**: returns the `Car` with a non-null `photo { url contentType }`.
3. `GET` the returned `photo.url` (no auth). **Expected**: `200` with the image bytes and correct `Content-Type`.

### Scenario B — Replace keeps a single photo (US1, FR-008)
1. As admin, call `addCarPhoto` again for the same car with a different image.
2. **Expected**: the car still has exactly one photo; fetching `photo.url` returns the new image.

### Scenario C — Authorization (US1, SC-002)
1. Call `addCarPhoto` with **no** token → **unauthorized**.
2. Call `addCarPhoto` as a non-admin customer → **forbidden**.
3. Same for `removeCarPhoto`.

### Scenario D — Validation (SC-003, FR-011)
1. As admin, submit a non-image (e.g. base64 of a text/PDF) or an oversize image.
2. **Expected**: clear validation error; **no** photo stored; any pre-existing photo still intact
   (re-fetch `photo.url` and confirm the old image, or 404 if there was none).

### Scenario E — Public viewing & empty state (US2, SC-005)
1. Query `car(carId) { photo { url contentType } }` with **no** auth for a car that has a photo →
   **Expected**: the photo is returned.
2. Same query for a car with no photo → **Expected**: `photo` is `null`, no error.

### Scenario F — Remove & cascade on car delete (US3, FR-005, SC-004)
1. As admin, `removeCarPhoto(carId)` → **Expected**: `photo` becomes `null`; `photo.url` now `404`.
2. As admin, add a photo again, then `deleteCar(carId)` → **Expected**: the car is gone and its
   photo file no longer exists in `PHOTO_STORAGE_DIR` (zero orphans).

## Success criteria coverage

| Scenario | Covers |
|----------|--------|
| A | SC-001 |
| B | FR-008 |
| C | SC-002 |
| D | SC-003, FR-011 |
| E | SC-005 |
| F | SC-004, FR-005 |
