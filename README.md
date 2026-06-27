# Car Rental Management Application

The Car Rental Management Application is a Node application which allows car rental companies to manage customer and car data via a 
GraphQL API

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

Below are some of the sample requests:

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

mutation rentCarToCustomer($carId: ID!, $customerId: ID!) {
  addCarToCustomer(carId: $carId, customerId: $customerId) {
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

Set these before `yarn start` (never commit them):

```sh
export BETTER_AUTH_SECRET=...     # random 32+ char string
export GOOGLE_CLIENT_ID=...       # Google OAuth 2.0 Web client id
export GOOGLE_CLIENT_SECRET=...   # Google OAuth 2.0 Web client secret
```

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
