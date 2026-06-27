<!--
  Sync Impact Report
  Version: 1.1.0 → 1.1.1 (PATCH — record TypeScript version bump in Technology Stack)

  Modified Principles: None

  Modified Sections:
  - Technology Stack — Runtime row now records TypeScript 5.x (5.9), upgraded from ~4.8 as
    required by Better Auth's type declarations (feature 001-user-authentication)

  Added Sections: None
  Removed Sections: None

  Templates reviewed:
  - .specify/templates/plan-template.md — feature-agnostic ✅ no update needed
  - .specify/templates/spec-template.md — feature-agnostic ✅ no update needed
  - .specify/templates/tasks-template.md — feature-agnostic ✅ no update needed
  - .specify/templates/commands/ — directory does not exist ✅ no update needed
  - CLAUDE.md — no TypeScript version pinned; no update needed ✅

  Deferred TODOs: None

  --- Prior amendment (1.0.0 → 1.1.0, MINOR): added skill references section and inline skill
      callouts to principles I, III, IV; added the "Skill References" sub-section. ---
-->

# Car Rental Management Constitution

## Core Principles

### I. Domain-Driven Design

The domain is the first-class concern of this codebase. All code MUST reflect the
ubiquitous language of the car rental domain — `Customer`, `Car`, `Rental` — never
synonyms such as `User`, `Vehicle`, or `Record`.

- `Customer` is the Aggregate Root for the rental relationship; mutations affecting
  a customer's cars MUST go through `Customer`, never by manipulating `Car` directly
- Entities are identified by ID; Value Objects are identified by value and MUST be immutable
- Business logic MUST live in Domain Services or Entities — never in resolvers
- Repositories MUST abstract persistence and speak in domain language, not Mongoose language
- Domain Events MUST be raised for meaningful domain occurrences (e.g., `CustomerRentedCar`)

**Rationale**: Consistent domain language across code and conversation prevents accidental
complexity and keeps the model aligned with business intent as the domain evolves.

> **Skill**: @.claude/skills/domain-driven-design/SKILL.md

### II. Schema-First GraphQL

The GraphQL schema in `src/typeDefs.ts` is the single source of truth for the API contract.

- TypeScript types MUST be auto-generated from the schema via `yarn generate-graphql-types`;
  hand-editing `src/generated/types.ts` is PROHIBITED
- `yarn generate-graphql-types` MUST be run immediately after any schema change
- Resolvers MUST use generated types; manual type declarations duplicating generated types
  are PROHIBITED
- Field resolvers for nested data (e.g., `Customer.cars`) MUST live in dedicated
  `{entity}/fetch{Related}.ts` files and use Mongoose `.populate()`

**Rationale**: Schema-first enforces a contract-driven approach; code generation eliminates
drift between the schema definition and implementation types.

### III. Test-First (NON-NEGOTIABLE)

TDD via Red-Green-Refactor is MANDATORY for all new code — no exceptions.

- Tests MUST be written before production code
- Test cases MUST be presented to and approved by the user before implementation begins
- Tests MUST be verified to fail (Red) before production code is written
- Tests MUST call through the real implementation stack; only external boundaries
  (MongoDB, external APIs) may be mocked — internal collaborators MUST NOT be mocked
- Tests are organized around business capabilities, not class structure (e.g.,
  `rental-eligibility.test.ts`, not `RentalEligibilityService.test.ts`)
- Argument capture MUST be used to verify correct values were passed to mocked dependencies;
  open `expect.anything()` matchers are PROHIBITED
- Integration tests MUST use Docker Compose via Jest `globalSetup`/`globalTeardown`;
  containers MUST NOT be managed inside individual test files

**Rationale**: A failing test first prevents false confidence. Calling through the real stack
means refactoring never breaks tests and coverage tools see actual end-to-end behavior.

> **Skills**: @.claude/skills/test-driven-development/SKILL.md
> @.claude/skills/integration-testing/SKILL.md

### IV. Clean Code & TypeScript Discipline

Code quality and type safety are non-negotiable. TypeScript strict mode is enforced
across the entire codebase.

- `any` is PROHIBITED; use `unknown` with explicit type narrowing
- Object shapes MUST use `interface`; unions and type aliases MUST use `type`
- All exported functions MUST declare explicit return types
- Domain primitives at external boundaries MUST use branded types (e.g., `CustomerId`, `CarId`)
- State variants MUST be modelled as discriminated unions with an exhaustiveness check via `never`
- Complex boolean conditions MUST be extracted into named predicates
- Magic string literals MUST be replaced with named constants
- Functions MUST operate at a single level of abstraction; SRP applies at both
  function and class level
- YAGNI/KISS: abstractions are introduced only when the problem requires them;
  three similar lines are better than a premature abstraction

**Rationale**: Strict TypeScript and clean code discipline reduce cognitive load, surface
bugs at compile time, and keep the codebase maintainable as the domain grows.

> **Skills**: @.claude/skills/coding-standards/SKILL.md
> @.claude/skills/typescript/SKILL.md

### V. Layered Architecture & Simplicity

Strict layering is enforced. Each layer has a single, well-defined responsibility.

```
GraphQL Resolver → Application/Domain Service → Repository → MongoDB
```

- Resolvers are delivery mechanisms: they translate GraphQL inputs to domain calls
  and MUST NOT contain business logic
- Domain Services are stateless; they own business rules that span multiple entities
- Repositories own all persistence concerns; Mongoose must not leak into domain callers
- Resolver registration MUST be collected in `src/resolvers.ts` and wired in
  `src/apolloServer.ts` — no ad hoc wiring elsewhere
- Configuration is hardcoded in `src/config/config.ts`; no `.env` file, no environment
  variable injection
- Speculative abstractions are PROHIBITED: add complexity only when a concrete need exists

**Rationale**: Clear layer boundaries make the codebase auditable and keep domain logic
independently testable without spinning up a GraphQL server.

## Technology Stack

| Concern | Technology |
|---------|-----------|
| Runtime | Node.js + TypeScript 5.x (strict mode) — upgraded from ~4.8, required by Better Auth's type declarations |
| API layer | Apollo GraphQL, schema-first via `src/typeDefs.ts` |
| Transport | Express on port `8082` |
| Persistence | MongoDB (`mongodb://localhost:27017`) via Mongoose (`src/model/`) |
| Type generation | GraphQL Code Generator (`yarn generate-graphql-types`) |
| Testing | Jest — TDD unit tests colocated with source; integration tests via Docker Compose |
| Dev tooling | nodemon + babel-node (`yarn start`) |

No frontend. All interaction is through the GraphQL endpoint at
`http://localhost:8082/graphQL`.

## Development Workflow

- **Branch naming**: `feature/<name>` per feature
- **After every schema change**: run `yarn generate-graphql-types` before committing
- **Run all tests**: `yarn test`
- **Run a single test file/dir**: `yarn test -- --testPathPattern <path-pattern>`
- **Test colocation**: `*.test.ts` files live next to the file under test; shared mock
  factories live in `src/testing/utilities.ts`
- **Resolver registration**: every new resolver MUST appear in `src/resolvers.ts`
  and be wired in `src/apolloServer.ts`
- **No `.env` file**: all configuration changes go in `src/config/config.ts`
- **Runtime development guidance**: `CLAUDE.md` is the authoritative reference for
  setup commands, architecture overview, and skill references

### Skill References

Detailed, enforceable guidance for each principle is defined in the following skill files.
Agents MUST load the relevant skill(s) before implementing work in that area.

@.claude/skills/domain-driven-design/SKILL.md
@.claude/skills/test-driven-development/SKILL.md
@.claude/skills/integration-testing/SKILL.md
@.claude/skills/coding-standards/SKILL.md
@.claude/skills/typescript/SKILL.md

## Governance

This constitution supersedes all other practices and documentation when conflicts arise.

- All plans MUST pass the Constitution Check in `plan.md` before implementation begins;
  the check MUST be re-run after Phase 1 design
- Complexity violations (e.g., deviation from layering, premature abstractions) MUST be
  recorded in the plan's Complexity Tracking table with a written justification
- Amendments require: documented rationale, a semantic version bump, and an update to
  this file and the Sync Impact Report comment
- **Versioning policy**:
  - MAJOR: backward-incompatible governance or principle removal/redefinition
  - MINOR: new principle or section added, or materially expanded guidance
  - PATCH: clarifications, wording, or non-semantic refinements
- `CLAUDE.md` is the runtime development guidance file and MUST remain synchronized
  with this constitution

**Version**: 1.1.1 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
