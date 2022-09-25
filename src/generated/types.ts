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

export type Car = {
  __typename?: 'Car';
  carId: Scalars['ID'];
  costPerDay: Scalars['Float'];
  customer?: Maybe<Customer>;
  leasedDate?: Maybe<Scalars['Date']>;
  make: Scalars['String'];
  model: Scalars['String'];
  returnDate?: Maybe<Scalars['Date']>;
  type: CarType;
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
  costPerDay: Scalars['Float'];
  make: Scalars['String'];
  model: Scalars['String'];
  type: CarType;
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
  age: Scalars['Int'];
  cars?: Maybe<Array<Car>>;
  customerId: Scalars['ID'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addCarToCustomer?: Maybe<Customer>;
  createCar?: Maybe<Car>;
  createCustomer?: Maybe<Customer>;
  deleteCar?: Maybe<Car>;
  deleteCustomer?: Maybe<Customer>;
  removeCarFromCustomer?: Maybe<Customer>;
  updateCar?: Maybe<Car>;
  updateCustomer?: Maybe<Customer>;
};


export type MutationAddCarToCustomerArgs = {
  carId: Scalars['ID'];
  customerId: Scalars['ID'];
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


export type MutationRemoveCarFromCustomerArgs = {
  carId: Scalars['ID'];
  customerId: Scalars['ID'];
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

export type UpdateCarInput = {
  costPerDay?: InputMaybe<Scalars['Float']>;
  leasedDate?: InputMaybe<Scalars['Date']>;
  make?: InputMaybe<Scalars['String']>;
  model?: InputMaybe<Scalars['String']>;
  returnDate?: InputMaybe<Scalars['Date']>;
  type?: InputMaybe<CarType>;
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