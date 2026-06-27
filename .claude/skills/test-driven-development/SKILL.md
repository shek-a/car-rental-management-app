# Test-Driven Development

## Red-Green-Refactor Cycle

Always follow this sequence — no exceptions:
1. **Red** — write a failing test that describes the required behavior
2. **Green** — write the minimal production code to make it pass
3. **Refactor** — improve the code without changing behavior, keeping tests green

Never write production code without a failing test that requires it.

## Review Tests Before Implementing

Before writing any production code, present the test cases to the user for review. Tests must be approved before implementation begins. This ensures the tests capture the correct requirements and edge cases before any code is written.

## Test Behavior, Not Implementation

Tests assert what the code does, not how it does it. A test that breaks when you rename a private method or extract a helper class is testing implementation, not behavior — rewrite it.

## No One-to-One Class Mapping

Unit tests do not require one test file per production class. Organize tests around business requirements and capabilities, not around the source file structure. A test file should describe a capability (`rental-eligibility.test.ts`), not mirror a class (`RentalEligibilityService.test.ts`).

## Call Through the Stack

Tests exercise real code paths. Don't isolate a single class — let tests call through to real collaborators. Only mock at external boundaries.

**Bad:** extracting `PricingDataLookup` and mocking it in `PricingService` tests.
**Good:** `PricingService` tests use the real `PricingDataLookup` and mock only the repository it wraps.

This ensures:
- Refactoring (extracting classes, renaming internals) never breaks tests
- Coverage tools (JaCoCo, Istanbul) include all internal collaborators
- Tests verify actual end-to-end behavior of the feature

## Mocking Strategy

**Mock only at external boundaries:**
- Persistence layer (databases, repositories, services that talk to a DB)
- External APIs and third-party services
- Message queues and event systems
- File system and network I/O

**Never mock:**
- Internal collaborators and helper classes extracted for code organisation
- Domain objects, entities, and value objects
- Business logic

**Use real objects for domain types.** Return real entity instances from mocked repositories:
```ts
// bad
const mockPricing = mock<ProductPricing>();

// good
mockPricingRepo.findById.mockResolvedValue(ProductPricing.create({ ... }));
```

## Verify Arguments with Capture

Never use open `any()` matchers without asserting the actual values. Use argument capture to verify the correct values were passed to mocked dependencies — this catches bugs where a service passes the wrong field to a repository.

```ts
// bad
expect(mockRepo.save).toHaveBeenCalledWith(expect.anything());

// good
const [savedRental] = mockRepo.save.mock.calls[0];
expect(savedRental.customerId).toBe(expectedCustomerId);
expect(savedRental.carId).toBe(expectedCarId);
```

## Align Tests to Business Requirements

Each test file describes a business capability. Test names read as requirements:

```ts
describe('rental eligibility', () => {
  it('denies rental when customer has overdue returns');
  it('denies rental when car is already rented');
  it('allows rental when customer is in good standing and car is available');
});
```
