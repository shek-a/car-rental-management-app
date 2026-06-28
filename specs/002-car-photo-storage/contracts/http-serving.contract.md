# HTTP Serving Contract: Car Photo

**Feature**: `002-car-photo-storage`

A public Express route serves photo bytes, mounted on the same app/port as GraphQL and Better Auth.
It is what `Car.photo.url` points at.

## Endpoint

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `${PHOTO_PATH}/:carId` (default `/photos/:carId`) | Public | Stream the car's photo bytes |

## Responses

| Status | When | Body / headers |
|--------|------|----------------|
| `200 OK` | Car has a photo | Image bytes; `Content-Type: <stored content type>` |
| `404 Not Found` | Car has no photo (or no such car) | Empty / short message |

## Behaviour

- Reads bytes via `CarPhotoStorage.load(carId)`; if `null` → `404`.
- Sets `Content-Type` from the stored photo so browsers/clients render it correctly.
- No authentication: viewing is public (FR-006), consistent with public car reads.
- Mounting: registered on the existing Express app in `src/server.ts`, alongside `/api/auth/*` and
  `/graphQL`. Placement is independent of the Better Auth handler.

## Relationship to GraphQL

`Car.photo` (GraphQL) returns `{ url, contentType }` where `url = AUTH_BASE_URL + PHOTO_PATH + "/" +
carId`. Clients query GraphQL for the URL, then fetch the image from this route. Bytes never travel
inside GraphQL responses.
