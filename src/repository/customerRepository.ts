import { CustomerModel, CustomerEntity } from "@/model/customer";

// Repository: the only place that speaks Mongoose. Callers work with domain Customer entities and
// never see the persistence layer (per the DDD layering principle).

export const findByAuthUserId = (
  authUserId: string
): Promise<CustomerEntity | null> => CustomerModel.findOne({ authUserId }).exec();

export const findByEmail = (
  email: string
): Promise<CustomerEntity | null> => CustomerModel.findOne({ email }).exec();

export const findByCustomerId = (
  customerId: string
): Promise<CustomerEntity | null> =>
  CustomerModel.findOne({ customerId }).exec();

export const create = (
  customer: CustomerEntity
): Promise<CustomerEntity> => new CustomerModel(customer).save();

export const update = (
  customerId: string,
  changes: Partial<CustomerEntity>
): Promise<CustomerEntity | null> =>
  CustomerModel.findOneAndUpdate(
    { customerId },
    { $set: changes },
    { new: true }
  ).exec();
