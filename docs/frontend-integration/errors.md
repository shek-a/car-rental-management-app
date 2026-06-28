# Error Handling

## How errors come back

This is a GraphQL API, so most failures return **HTTP 200** with an `errors` array in the body
(not an HTTP error status). Always inspect `errors`, not just the HTTP status:

```json
{
  "data": { "addCarPhoto": null },
  "errors": [
    { "message": "Administrator role required", "path": ["addCarPhoto"], "extensions": { "code": "..." } }
  ]
}
```

Apollo Client / urql surface these as the operation's error; check `error.graphQLErrors`.

The exception is the photo **bytes** route: `GET /photos/:carId` is plain HTTP and returns **404**
when a car has no photo.

## Error categories

The platform distinguishes three kinds of failure by **message**. Match on these to drive UX:

### 1. Not signed in (treat like 401)
- Message: **`Authentication required`**
- Cause: calling a protected operation with no / an invalid / an expired token.
- Handle: prompt the user to sign in, then retry.

### 2. Signed in but not allowed (treat like 403)
- Messages:
  - **`Administrator role required`** — a non-admin attempted an admin operation.
  - **`You can only act on your own account`** — a customer passed a `customerId` that isn't theirs
    on rent/return.
- Handle: hide/disable the action in the UI for this user; show a "not permitted" message.

### 3. Validation / business rule (treat like 422 / 400)
- Examples:
  - `Car id <id> does not exist`
  - `Customer id <id> does not exist`
  - `Customer id <id> already has car id <id>`
  - `Car id <id> is already leased out`
  - `Invalid car photo: ...` (unsupported format, not decodable, or over 5 MB)
- Handle: show the message contextually (e.g. on the form field); the operation made no changes.

## Suggested client mapping

```ts
function classify(message: string): "auth" | "forbidden" | "validation" {
  if (message === "Authentication required") return "auth";
  if (message === "Administrator role required" ||
      message === "You can only act on your own account") return "forbidden";
  return "validation";
}
```

> **Match on the message, not the code.** Today every thrown error surfaces with
> `extensions.code: "INTERNAL_SERVER_ERROR"` (verified against the running server) regardless of
> category, so the `code` is not yet a reliable discriminator. If you need machine-readable codes
> (`UNAUTHENTICATED` / `FORBIDDEN`), ask the backend team to surface them in `extensions.code`
> consistently.

## Important: partial-failure safety

Operations are all-or-nothing for the resource they touch. In particular, a **failed photo upload
leaves any existing photo intact** — you can safely retry without losing the previous image.

## Network / transport errors

A non-200 HTTP response or a thrown network error (CORS, server down, malformed request) is separate
from GraphQL `errors`. Handle these as transport failures (retry/backoff, "service unavailable"),
distinct from the in-band errors above. Note the cross-origin (CORS) prerequisite in
[authentication.md](./authentication.md#prerequisites-backend-team) — a misconfigured origin shows up
here as a network/CORS error.
