# Coding Standards

Apply Gang of Four design patterns, SOLID principles, DRY, YAGNI, and KISS **pragmatically** — only introduce a pattern when the problem genuinely calls for it. Never apply them mechanically or speculatively.

## Single Responsibility Principle (SRP)

Every class and function has exactly one reason to change. If a unit of code does classification **and** calculation **and** formatting, split it — each piece owns one concept.

**Violation:**
```ts
function processRental(car, customer) {
  // validates, calculates price, formats receipt — three reasons to change
}
```
**Fix:** `validateRental()`, `calculateRentalPrice()`, `formatReceipt()` — one concept each.

## Single Level of Abstraction

Every function operates at one conceptual level. Don't mix orchestration with low-level implementation details in the same method.

**Violation:**
```ts
function handleCheckout(cart) {
  cart.items.forEach(item => { /* raw loop logic */ });
  sendEmail(user.email, `Dear ${user.name}...`);  // low-level detail
  updateInventory();
}
```
**Fix:** Extract `applyCartItems(cart)` and `sendConfirmationEmail(user)` — `handleCheckout` only orchestrates.

## Extract Boolean Conditions into Named Methods

Complex boolean expressions should be extracted into a named predicate that communicates intent.

**Violation:**
```ts
if (car.status === 'available' && !customer.hasOverdueRentals && customer.licenseExpiry > Date.now()) {
```
**Fix:**
```ts
if (isEligibleForRental(car, customer)) {
```

## Constants Over String Literals

Never repeat a string literal that carries meaning. Define it as a named constant where it's used more than once, or where its value is non-obvious.

**Violation:**
```ts
if (car.status === 'available') { ... }
if (car.status === 'available') { ... }
```
**Fix:**
```ts
const CAR_STATUS = { AVAILABLE: 'available', RENTED: 'rented' } as const;
if (car.status === CAR_STATUS.AVAILABLE) { ... }
```

## Clean Code

- Name variables and functions so the code reads like prose — a reader should understand intent without comments.
- Minimize cognitive load: short functions, limited parameters, no surprise side effects.
- Prefer explicit over clever. If a future reader would pause to decode it, rewrite it.
