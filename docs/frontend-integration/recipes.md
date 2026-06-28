# Recipes

End-to-end flows for a browser app. Examples use `fetch`; adapt to Apollo Client / urql as you like.
A small helper:

```ts
async function gql(query: string, variables?: object, token?: string) {
  const res = await fetch("http://localhost:8082/graphQL", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}
```

## 1. Sign in and learn who you are

```ts
import { authClient } from "./auth-client"; // from authentication.md

// Redirects to Google, then back to your callbackURL:
await authClient.signIn.social({ provider: "google", callbackURL: "http://localhost:3000/home" });

// After returning, read the session and the domain Customer (incl. role):
const me = await gql(`query { customers { customerId email role } }`); // or query your own customer
```

Cache the customer's `customerId` and `role` — you need the id for rent/return and the role to gate
admin UI. (See [authentication.md](./authentication.md) for getting the bearer `token`.)

## 2. Browse the catalogue and show photos (no auth)

```ts
const { cars } = await gql(`
  query {
    cars { carId make model type costPerDay photo { url contentType } }
  }
`);

// In your view:
// cars.map(c => <img src={c.photo?.url ?? PLACEHOLDER} alt={`${c.make} ${c.model}`} />)
```

Photos are public; render `photo.url` directly. `photo` is `null` when a car has no image.

## 3. Rent a car (signed-in customer, own account)

```ts
await gql(
  `mutation ($carId: ID!, $customerId: ID!) {
     addCarToCustomer(carId: $carId, customerId: $customerId) {
       customerId cars { carId make model }
     }
   }`,
  { carId: "1", customerId: myCustomerId }, // MUST be the signed-in customer's own id
  token
);
```

Expected errors: `You can only act on your own account` (wrong id), `Car id 1 is already leased out`,
`Authentication required` (no token). Returning is identical with `removeCarFromCustomer`.

## 4. Admin: add a car and give it a photo

```ts
// Create the car (admin token required)
await gql(
  `mutation ($input: CreateCarInput!) { createCar(input: $input) { carId } }`,
  { input: { carId: "10", make: "Tesla", model: "Model Y", type: "SUV", costPerDay: 110 } },
  adminToken
);

// Upload its photo (base64 — see photos.md for toBase64)
await gql(
  `mutation ($carId: ID!, $input: AddCarPhotoInput!) {
     addCarPhoto(carId: $carId, input: $input) { carId photo { url } }
   }`,
  { carId: "10", input: { data: base64Image, contentType: "image/jpeg" } },
  adminToken
);
```

A non-admin doing either gets `Administrator role required`.

## 5. Admin: promote another user

```ts
await gql(
  `mutation ($customerId: ID!) { grantAdministratorRole(customerId: $customerId) { customerId role } }`,
  { customerId: "some-customer-id" },
  adminToken
);
```

The promoted user gains admin rights on their next request — no re-login needed.

## 6. Sign out

```ts
await authClient.signOut();
// Drop any stored bearer token in your app state.
```

---

For the full operation list and types see [api-reference.md](./api-reference.md); for who-can-do-what
see [authorization.md](./authorization.md); for failure handling see [errors.md](./errors.md).
