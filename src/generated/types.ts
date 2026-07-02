export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
};

export type AddCarPhotoInput = {
  contentType: Scalars['String'];
  data: Scalars['String'];
};

export type Car = {
  __typename?: 'Car';
  carId: Scalars['ID'];
  colour?: Maybe<Scalars['String']>;
  costPerDay: Scalars['Float'];
  customer?: Maybe<Customer>;
  fuel?: Maybe<Scalars['String']>;
  leasedDate?: Maybe<Scalars['Date']>;
  make: Scalars['String'];
  model: Scalars['String'];
  photo?: Maybe<CarPhoto>;
  plate?: Maybe<Scalars['String']>;
  rentalPeriod?: Maybe<RentalPeriod>;
  returnDate?: Maybe<Scalars['Date']>;
  seats?: Maybe<Scalars['Int']>;
  status: FleetStatus;
  transmission?: Maybe<Scalars['String']>;
  type: CarType;
  year?: Maybe<Scalars['Int']>;
};

export type CarPhoto = {
  __typename?: 'CarPhoto';
  contentType: Scalars['String'];
  url: Scalars['String'];
};

export enum CarType {
  Convertable = 'CONVERTABLE',
  Coupe = 'COUPE',
  Hatch = 'HATCH',
  Sedan = 'SEDAN',
  Suv = 'SUV'
}

export type CreateCarInput = {
  carId: Scalars['ID'];
  colour?: InputMaybe<Scalars['String']>;
  costPerDay: Scalars['Float'];
  fuel?: InputMaybe<Scalars['String']>;
  make: Scalars['String'];
  model: Scalars['String'];
  plate?: InputMaybe<Scalars['String']>;
  seats?: InputMaybe<Scalars['Int']>;
  transmission?: InputMaybe<Scalars['String']>;
  type: CarType;
  year?: InputMaybe<Scalars['Int']>;
};

export type CreateCustomerInput = {
  age: Scalars['Int'];
  customerId: Scalars['String'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
};

export type Customer = {
  __typename?: 'Customer';
  age?: Maybe<Scalars['Int']>;
  cars?: Maybe<Array<Car>>;
  customerId: Scalars['ID'];
  email: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  role: CustomerRole;
};

export enum CustomerRole {
  Administrator = 'ADMINISTRATOR',
  Customer = 'CUSTOMER'
}

export enum FleetStatus {
  Available = 'AVAILABLE',
  DueSoon = 'DUE_SOON',
  Leased = 'LEASED',
  Overdue = 'OVERDUE'
}

export type Mutation = {
  __typename?: 'Mutation';
  addCarPhoto?: Maybe<Car>;
  addCarToCustomer?: Maybe<Customer>;
  createCar?: Maybe<Car>;
  createCustomer?: Maybe<Customer>;
  deleteCar?: Maybe<Car>;
  deleteCustomer?: Maybe<Customer>;
  grantAdministratorRole?: Maybe<Customer>;
  removeCarFromCustomer?: Maybe<Customer>;
  removeCarPhoto?: Maybe<Car>;
  updateCar?: Maybe<Car>;
  updateCustomer?: Maybe<Customer>;
};


export type MutationAddCarPhotoArgs = {
  carId: Scalars['ID'];
  input: AddCarPhotoInput;
};


export type MutationAddCarToCustomerArgs = {
  carId: Scalars['ID'];
  customerId: Scalars['ID'];
  dueBackDate: Scalars['Date'];
};


export type MutationCreateCarArgs = {
  input: CreateCarInput;
};


export type MutationCreateCustomerArgs = {
  input: CreateCustomerInput;
};


export type MutationDeleteCarArgs = {
  carId: Scalars['ID'];
};


export type MutationDeleteCustomerArgs = {
  customerId: Scalars['ID'];
};


export type MutationGrantAdministratorRoleArgs = {
  customerId: Scalars['ID'];
};


export type MutationRemoveCarFromCustomerArgs = {
  carId: Scalars['ID'];
  customerId: Scalars['ID'];
};


export type MutationRemoveCarPhotoArgs = {
  carId: Scalars['ID'];
};


export type MutationUpdateCarArgs = {
  carId: Scalars['ID'];
  input: UpdateCarInput;
};


export type MutationUpdateCustomerArgs = {
  customerId: Scalars['ID'];
  input: UpdateCustomerInput;
};

export type Query = {
  __typename?: 'Query';
  car?: Maybe<Car>;
  cars: Array<Car>;
  customer?: Maybe<Customer>;
  customers: Array<Customer>;
};


export type QueryCarArgs = {
  carId: Scalars['ID'];
};


export type QueryCustomerArgs = {
  customerId: Scalars['ID'];
};

export type RentalPeriod = {
  __typename?: 'RentalPeriod';
  dueBackDate: Scalars['Date'];
  leaseDate: Scalars['Date'];
};

export type UpdateCarInput = {
  colour?: InputMaybe<Scalars['String']>;
  costPerDay?: InputMaybe<Scalars['Float']>;
  fuel?: InputMaybe<Scalars['String']>;
  leasedDate?: InputMaybe<Scalars['Date']>;
  make?: InputMaybe<Scalars['String']>;
  model?: InputMaybe<Scalars['String']>;
  plate?: InputMaybe<Scalars['String']>;
  returnDate?: InputMaybe<Scalars['Date']>;
  seats?: InputMaybe<Scalars['Int']>;
  transmission?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<CarType>;
  year?: InputMaybe<Scalars['Int']>;
};

export type UpdateCustomerInput = {
  age?: InputMaybe<Scalars['Int']>;
  email?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
};

export type AdditionalEntityFields = {
  path?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
};

import { ObjectId } from 'mongodb';