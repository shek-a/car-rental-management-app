# Car Rental Management Application

The Car Rental Management Application is a Node.js + Apollo GraphQL backend for running a car rental
service. Customers sign in with their Google account (no passwords are stored) and can browse the
public car catalogue, rent cars, and return them. Administrators manage the fleet — creating and
deleting cars, attaching a photo to each car, and granting administrator access to others. Access is
role-based (Customer and Administrator), authentication is handled by Better Auth, and all data is
stored in MongoDB and served through a single GraphQL API (with car photos served over HTTP).

## Requirements
You need the following installed to run the application locally
* Node
* Yarn
* Docker

## Running the Application locally

The application stores data in a MongoDB database, so you will need a MongoDB instance running locally. To run a Mongo Docker image, run the following command:
```
docker run -d -p 27017:27017 --name car-rental-magement-app mongo
```
### Build
Build the application using the following command:

```sh
yarn
```

### Unit Test

Run the unit tests using the following command:

```
yarn test
```

### Run

Run the application using following command:

```
yarn start
```

### Calling the Application's GraphQL API
Use any API client to call the application's GraphQL API.
A handy one is the Chrome Plugin, 'GraphQL Playground for Chrome'
https://chrome.google.com/webstore/detail/graphql-playground-for-ch/kjhjcgclphafojaeeickcokfbhlegecd?hl=en 

> **Building a web app against this API?** See the
> **[Frontend Integration Guide](docs/frontend-integration/README.md)** — authentication, the
> authorization matrix, a full API reference, photos, error handling, recipes, and a
> [`schema.graphql`](docs/frontend-integration/schema.graphql) for client codegen.

Below are some of the sample requests (note: several operations now require an
`Authorization: Bearer <token>` header — see the guide above):

#### Creating a customer
``` 
POST http://localhost:8082/graphQL

mutation createCustomer ($customer: CreateCustomerInput!) {
  createCustomer(input: $customer) {
    customerId
  }
}

Query Variables
{
  "customer": {
    "customerId": "1",
    "firstName": "Roger",
    "lastName": "Federer",
    "email": "Roger.Federer@gmail.com",
    "age": 40
  }
}
```

#### Creating a car
``` 
POST http://localhost:8082/graphQL

mutation createCar($car: CreateCarInput!) {
  createCar(input: $car) {
    carId
    model
    type
    costPerDay
  }
}

Query Variables
{
  "car": {
    "carId": "1",
    "make": "Subaru",
    "model": "Outback",
    "type": "SUV",
    "costPerDay": 55.55
  }
}
```

#### Fetch all cars
``` 
POST http://localhost:8082/graphQL

query fetchAllCars {
  cars {
    carId
    make
    model
    type
    leasedDate
    returnDate
    customer {
      customerId
      firstName
      lastName
    }
  }
}
```

#### Rent a car to a customer
``` 
POST http://localhost:8082/graphQL

mutation rentCarToCustomer($carId: ID!, $customerId: ID!, $dueBackDate: Date!) {
  addCarToCustomer(carId: $carId, customerId: $customerId, dueBackDate: $dueBackDate) {
    customerId
    firstName
    lastName
    email
    cars {
      carId
      make
      model
      status
      rentalPeriod { dueBackDate }
    }
  }
}

Query Variables
{
  "customerId": 2,
  "carId": 3,
  "dueBackDate": "2026-07-15T09:00:00.000Z"
}
```

#### Customer returns the car
``` 
POST http://localhost:8082/graphQL

mutation customerReturnsCar($carId: ID!, $customerId: ID!) {
  removeCarFromCustomer(carId: $carId, customerId: $customerId) {
    customerId
    firstName
    lastName
    email
    cars {
      carId
      make
      model
    }
  }
}

Query Variables
{
  "customerId": 2,
  "carId": 3
}
```

## Authentication & Authorization

Sign-in is delegated to Google via [Better Auth](https://better-auth.com) — the platform stores no
passwords. See `specs/001-user-authentication/` for the full spec, plan, and contracts.

### Required environment variables (secrets)

Copy the template and fill in the values — `.env` is git-ignored, never commit it:

```sh
cp .env.example .env
```

```sh
BETTER_AUTH_SECRET=...     # random 32+ char string (openssl rand -base64 32)
GOOGLE_CLIENT_ID=...       # Google OAuth 2.0 Web client id
GOOGLE_CLIENT_SECRET=...   # Google OAuth 2.0 Web client secret
```

The server loads `.env` at startup via [dotenv](https://github.com/motdotla/dotenv). Variables
already exported in the shell take precedence over `.env` values.

Create the OAuth client in the Google Cloud Console and register
`http://localhost:8082/api/auth/callback/google` as an authorized redirect URI. Non-secret auth
config (base URL, seed admin email) lives in `src/config/config.ts`.

### Signing in (headless API client)

1. Open `http://localhost:8082/api/auth/sign-in/social?provider=google` in a browser and complete
   the Google consent screen (the browser step is inherent to OAuth).
2. Better Auth issues a session; the token is returned in the `set-auth-token` response header.
3. Send that token on GraphQL requests as `Authorization: Bearer <token>`.

On first sign-in a `Customer` is provisioned for the Google identity; repeat sign-ins reuse it.

### Roles

- **Customer** — may rent/return cars against their own account.
- **Administrator** — may create/delete cars and grant the administrator role to others via the
  `grantAdministratorRole` mutation. The seed admin (`andrew.shek23@gmail.com`) is an administrator
  on sign-in; reading the car catalogue is public.

## Car Photos

Each car can have a single photo, managed by administrators and viewable publicly. Image bytes are
held behind a platform-agnostic storage port; the bundled adapter stores them on the **local
filesystem**, so the feature runs with no cloud account (ideal for demos). See
`specs/002-car-photo-storage/` for the full spec, plan, and contracts.

### Storage configuration (local)

Non-secret config in `src/config/config.ts`:

- `PHOTO_STORAGE_DIR` (default `./.photo-storage`) — where image files are written (git-ignored)
- `PHOTO_MAX_BYTES` (default 5 MB) — per-photo size limit
- `PHOTO_PATH` (default `/photos`) — public serving route prefix

To use a different storage backend later (e.g. S3/GCS), implement the `CarPhotoStorage` port in
`src/storage/` and select it in `carPhotoStorageProvider` — no other code changes.

### Adding a photo (administrators only)

Send the image as base64 with its content type. The server re-verifies the real format from the
bytes (JPEG/PNG/WebP) and the size before storing.

```
POST http://localhost:8082/graphQL
Authorization: Bearer <admin token>

mutation addPhoto($carId: ID!, $input: AddCarPhotoInput!) {
  addCarPhoto(carId: $carId, input: $input) {
    carId
    photo { url contentType }
  }
}

Query Variables
{
  "carId": "1",
  "input": { "data": "<base64-encoded image>", "contentType": "image/jpeg" }
}
```

Adding a photo to a car that already has one replaces it. `removeCarPhoto(carId)` removes it; both
require an administrator.

### Viewing a photo (public)

Query the car for its photo URL, then fetch the bytes — no authentication required:

```
query { car(carId: "1") { photo { url contentType } } }

# then GET the returned url, e.g.:
GET http://localhost:8082/photos/1
```

A car with no photo returns `photo: null` (not an error). Deleting a car also deletes its photo.
