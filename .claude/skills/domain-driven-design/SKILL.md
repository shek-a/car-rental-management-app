# Domain-Driven Design

## Ubiquitous Language

Use domain terms consistently across code, conversations, and documentation. When a domain concept has a name, that exact name should appear in class names, method names, and variables — not synonyms or technical abbreviations.

**Violation:**
```ts
function addVehicleToUser(vehicleId, userId) { ... }
```
**Fix:**
```ts
function addCarToCustomer(carId: string, customerId: string) { ... }
```

## Entities vs Value Objects

**Entities** have identity that persists over time — equality is determined by ID, not by attribute values. **Value Objects** have no identity — equality is determined entirely by their attribute values. Value Objects should be immutable.

```ts
// Entity — same customer even if name changes
class Customer {
  constructor(public readonly id: string) {}
}

// Value Object — two addresses with same fields are equal; no id needed
class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
  ) {}
}
```

## Aggregates and Aggregate Roots

An **Aggregate** is a cluster of domain objects that must stay consistent together. The **Aggregate Root** is the only entry point — external code never holds references to inner objects directly.

In this domain, `Customer` is the Aggregate Root for the rental relationship. Mutations that affect a customer's cars go through `Customer`, not by manipulating the `Car` collection directly.

**Violation:**
```ts
await Car.findByIdAndUpdate(carId, { customer: customerId });
```
**Fix:** Drive the change through the Customer aggregate — `addCarToCustomer` on the Customer entity enforces invariants (e.g. car not already rented).

## Domain Services

Logic that doesn't naturally belong to a single Entity or Value Object belongs in a **Domain Service**. Domain Services are stateless and operate on domain objects.

Use a Domain Service when:
- The operation involves multiple aggregates
- The logic would feel unnatural on any single entity
- Examples: `RentalEligibilityService`, `PricingService`

Do not put this logic in resolvers — resolvers are delivery mechanisms, not the domain.

## Repositories

Repositories abstract persistence. They speak the language of the domain (collections of Entities), not the language of the database.

```ts
// bad — infrastructure leaking into domain callers
const customer = await Customer.findById(id).populate('cars');

// good — hide Mongoose behind a repository
const customer = await customerRepository.findById(id);
```

## Layering

Keep domain logic out of resolvers. Resolvers translate between the GraphQL transport layer and the domain — they should delegate immediately to domain services or repositories, not contain business rules.

```
GraphQL Resolver  →  Application/Domain Service  →  Repository  →  DB
```

Business rules belong in Domain Services or Entities, never in resolvers.

## Domain Events

When something meaningful happens in the domain, model it explicitly as an event rather than hiding the side effect inside a mutation.

```ts
// Instead of burying side effects in a mutation:
class CustomerRentedCar {
  constructor(
    public readonly customerId: string,
    public readonly carId: string,
    public readonly rentedAt: Date,
  ) {}
}
```

Raise events from the Aggregate Root; handlers react to them.
