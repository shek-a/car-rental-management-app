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
  customerId: Scalars['ID'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createCustomer?: Maybe<Customer>;
  deleteCustomer?: Maybe<Customer>;
  updateCustomer?: Maybe<Customer>;
};


export type MutationCreateCustomerArgs = {
  input: CreateCustomerInput;
};


export type MutationDeleteCustomerArgs = {
  customerId: Scalars['ID'];
};


export type MutationUpdateCustomerArgs = {
  customerId: Scalars['ID'];
  input: UpdateCustomerInput;
};

export type Query = {
  __typename?: 'Query';
  customer?: Maybe<Customer>;
  customers: Array<Customer>;
};


export type QueryCustomerArgs = {
  customerId: Scalars['ID'];
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