# TypeScript Best Practices

## Strict Configuration

All projects use strict mode. These compiler options are non-negotiable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

## `unknown` Over `any`

Never use `any`. Use `unknown` when the type is genuinely not known, then narrow it before use. `any` silently disables type checking; `unknown` forces you to verify before accessing.

```ts
// bad
function parse(input: any) {
  return input.name; // no error, no safety
}

// good
function parse(input: unknown) {
  if (typeof input === 'object' && input !== null && 'name' in input) {
    return (input as { name: string }).name;
  }
  throw new Error('Invalid input');
}
```

When a type assertion (`as`) is unavoidable, comment why. Unexplained assertions are a code smell.

## `interface` Over `type` for Object Shapes

Prefer `interface` for object shapes — error messages are clearer and interfaces support declaration merging.

Reserve `type` for unions, intersections, mapped types, and aliases:

```ts
// object shape → interface
interface Customer {
  id: string;
  name: string;
}

// union → type
type RentalStatus = 'available' | 'rented' | 'maintenance';
```

## Discriminated Unions for State and Errors

Model states and results as discriminated unions, not nullable fields or error codes. TypeScript narrows exhaustively in `switch` statements.

```ts
type RentalResult =
  | { kind: 'success'; rental: Rental }
  | { kind: 'car_unavailable'; carId: string }
  | { kind: 'customer_ineligible'; reason: string }

function handleResult(result: RentalResult) {
  switch (result.kind) {
    case 'success':
      return result.rental; // narrowed to { kind: 'success'; rental: Rental }
    case 'car_unavailable':
      throw new Error(`Car ${result.carId} is not available`);
    case 'customer_ineligible':
      throw new Error(result.reason);
  }
}
```

Add a `never` exhaustiveness check when the union must be fully handled:

```ts
default:
  const _exhaustive: never = result;
  throw new Error(`Unhandled case: ${_exhaustive}`);
```

## `satisfies` for Constrained Literals (TS 4.9+)

Use `satisfies` to validate a value against a type while preserving its literal type — unlike a type annotation, which widens the type.

```ts
// bad — type annotation widens 'available' to string
const CAR_STATUS: Record<string, string> = {
  AVAILABLE: 'available',
  RENTED: 'rented',
}

// good — satisfies validates the shape, literal types are preserved
const CAR_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
} satisfies Record<string, string>

type CarStatus = typeof CAR_STATUS[keyof typeof CAR_STATUS] // 'available' | 'rented'
```

## `const` Assertions for Literal Inference

Use `as const` when you need TypeScript to infer the narrowest possible type from a literal value:

```ts
const ROLES = ['admin', 'customer', 'agent'] as const
type Role = typeof ROLES[number] // 'admin' | 'customer' | 'agent'
```

## Branded Types for Domain Primitives

Prevent primitive values from being accidentally swapped by creating nominal types at domain boundaries:

```ts
type Brand<K, T> = K & { readonly __brand: T }
type CustomerId = Brand<string, 'CustomerId'>
type CarId = Brand<string, 'CarId'>

function addCarToCustomer(customerId: CustomerId, carId: CarId) { ... }

// compiler error — arguments are in the wrong order
addCarToCustomer(carId, customerId)
```

## Explicit Return Types on Public APIs

Declare return types explicitly on exported functions and class methods. This makes the contract clear and surfaces type regressions at the definition site, not at every call site.

```ts
// bad — return type inferred, regressions surface at callers
export async function findCustomer(id: string) {
  return Customer.findById(id)
}

// good
export async function findCustomer(id: string): Promise<Customer | null> {
  return Customer.findById(id)
}
```

Internal/private helpers may rely on inference.

## Type Narrowing Patterns

Prefer control-flow narrowing over type assertions. TypeScript understands `typeof`, `instanceof`, `in`, and equality checks:

```ts
function processInput(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase() // narrowed to string
  }
  return value.toFixed(2) // narrowed to number
}
```

For complex shapes, write a type predicate rather than casting:

```ts
function isCustomer(value: unknown): value is Customer {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  )
}
```

## Error Handling

Use custom error classes with proper stack preservation, not string throws:

```ts
class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
    Error.captureStackTrace(this, this.constructor)
  }
}
```

## Code Review Checklist

- [ ] No `any` — use `unknown` with narrowing
- [ ] No unexplained type assertions (`as`)
- [ ] Object shapes use `interface`, unions/aliases use `type`
- [ ] Exported functions have explicit return types
- [ ] Domain primitives use branded types at external boundaries
- [ ] State variants modelled as discriminated unions
- [ ] Discriminated unions have exhaustiveness check via `never`
- [ ] `satisfies` used instead of type annotation where literal types must be preserved
