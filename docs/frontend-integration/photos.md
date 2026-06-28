# Car Photos

Each car can have **one** photo. Administrators manage it; anyone can view it. Image **bytes** are
served over plain HTTP (not inside GraphQL); GraphQL only gives you the URL.

## Viewing a photo (public, no auth)

1. Query the car's `photo`:

```graphql
query ($carId: ID!) {
  car(carId: $carId) { carId photo { url contentType } }
}
```

2. If `photo` is non-null, use `photo.url` directly — e.g. as an `<img src>`:

```html
<img src="http://localhost:8082/photos/1" alt="car" />
```

`GET /photos/:carId` returns the image bytes with the correct `Content-Type` (200), or **404** if the
car has no photo. `photo` is `null` in GraphQL when there's no image — render a placeholder.

> The URL is built by the server (`<base>/photos/<carId>`). Use the `url` from the response rather
> than constructing it yourself, so your app keeps working if the scheme changes.

## Uploading a photo (administrator only)

Send the image **base64-encoded** in the `addCarPhoto` mutation. Adding a photo to a car that already
has one **replaces** it.

```graphql
mutation ($carId: ID!, $input: AddCarPhotoInput!) {
  addCarPhoto(carId: $carId, input: $input) {
    carId
    photo { url contentType }
  }
}
```
```json
{
  "carId": "1",
  "input": { "data": "<base64-encoded image>", "contentType": "image/jpeg" }
}
```

Requires `Authorization: Bearer <admin token>`.

### Producing the base64 in a browser

```ts
async function toBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

const data = await toBase64(file); // pass as input.data
```

A `data:` URI prefix (`data:image/jpeg;base64,...`) is also accepted and stripped server-side, so you
can pass a `FileReader.readAsDataURL` result directly if that's easier.

### Constraints (validated server-side)

- **Formats:** JPEG, PNG, WebP. The server verifies the **actual** bytes (magic-byte signature), not
  the `contentType` you send — sending `image/jpeg` for a PDF is rejected.
- **Size:** max **5 MB** (decoded).
- On any validation failure the mutation errors and **nothing changes** — an existing photo stays
  intact. See [errors.md](./errors.md).

Validate type/size in your UI for a better UX, but the server is the final authority.

## Removing a photo (administrator only)

```graphql
mutation ($carId: ID!) {
  removeCarPhoto(carId: $carId) { carId photo { url contentType } }
}
```
`photo` comes back `null`. Deleting the car (`deleteCar`) also removes its photo automatically.

## Caching note

`photo.url` for a given car is stable (`/photos/<carId>`), so after a **replace** the URL is
unchanged — browsers may show a stale image. Cache-bust on the client if needed, e.g.
`` `${photo.url}?v=${Date.now()}` `` after an upload.
