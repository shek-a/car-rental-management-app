# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

Requires Node.js, Yarn, and Docker.

```bash
yarn                          # Install dependencies
docker run -d -p 27017:27017 --name car-rental-magement-app mongo  # Start MongoDB
yarn start                    # Dev server with hot-reload
```

GraphQL endpoint: `http://localhost:8082/graphQL`

## Commands

```bash
yarn start                    # Start server (nodemon + babel-node)
yarn test                     # Run all Jest tests
yarn test -- --testPathPattern src/resolvers/mutations/car  # Run a single test file/dir
yarn generate-graphql-types   # Regenerate src/generated/types.ts from schema
```

## Architecture

This is a Node.js/Express + Apollo GraphQL backend — no frontend. The domain models two entities: `Customer` and `Car`, with a one-to-many rental relationship (a customer can hold multiple cars).

**Schema-first GraphQL**: The schema is defined in `src/typeDefs.ts`. TypeScript types are auto-generated from it into `src/generated/types.ts` via GraphQL Code Generator — always run `yarn generate-graphql-types` after schema changes, never hand-edit the generated file.

**Resolver organization** follows a consistent pattern:
```
src/resolvers/
  queries/{entity}/{queryName}.ts       # Read operations
  mutations/{entity}/{mutationName}.ts  # Write operations
  {entity}/fetch{Related}.ts            # Field resolvers for nested data
```

Resolvers are collected and merged in `src/resolvers.ts`, then wired to Apollo in `src/apolloServer.ts`.

**MongoDB access** uses Mongoose models defined in `src/model/`. Nested entity data (e.g. `Customer.cars`) is fetched via Mongoose `.populate()` in field resolvers, not embedded directly.

**Config** is hardcoded in `src/config/config.ts` (port `8082`, DB URI `mongodb://localhost:27017`) — no `.env` file.

@.claude/skills/coding-standards/SKILL.md
@.claude/skills/domain-driven-design/SKILL.md
@.claude/skills/typescript/SKILL.md

## Testing

TDD is required — follow the Red-Green-Refactor cycle for all new code. See the full TDD guidelines below.

Tests are colocated with their implementations (`*.test.ts` next to the file under test). Shared mock factories live in `src/testing/utilities.ts`.

To run a single test:
```bash
yarn test -- --testPathPattern <path-pattern>
```

@.claude/skills/test-driven-development/SKILL.md
@.claude/skills/integration-testing/SKILL.md

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/002-car-photo-storage/plan.md`
<!-- SPECKIT END -->
