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
