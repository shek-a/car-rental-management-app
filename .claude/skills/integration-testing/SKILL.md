# Integration Testing

## Testing Pyramid — Don't Duplicate Unit Tests

Integration tests sit in the middle of the testing pyramid. Their job is to verify that boundaries work (database, message queues, external APIs) — not to re-test business logic that unit tests already cover.

- **Don't** assert business rule edge cases in integration tests — that's the unit test's job.
- **Do** assert that data flows correctly through the boundary (persisted, published, consumed).
- **Do** assert that infrastructure concerns work (transactions, serialization, DLQ routing).

A passing integration test means *"the system is wired correctly."*
A passing unit test means *"the logic is correct."*

Keep them separate.

## Unit Tests vs Integration Tests

**Unit Tests (TDD):**
- Test behavior through public APIs
- May call through multiple classes in the stack
- Mock only external boundaries (databases, APIs, file systems)
- Fast execution, focus on business logic and behavior

**Integration Tests:**
- Test interactions with real external systems
- Verify system boundaries work correctly
- Slower execution (acceptable)
- Use real databases, message queues, APIs
- Focus on integration points and data flow

## What Integration Tests Should Cover

### Database Integration
- **Schema compatibility** — verify entities map correctly to the database schema
- **Complex queries** — joins, aggregations, and filtering work as expected
- **Transactions** — transaction boundaries and rollback behavior are correct
- **Constraints** — foreign keys, unique constraints, and indexes are enforced
- **Migrations** — schema migrations apply cleanly and leave data in the correct state

### External API Integration
- **Contract verification** — API contracts are honored (request shape, response mapping)
- **Error handling** — timeout, retry, and failure scenarios behave correctly
- **Data serialization** — request/response mapping is correct end-to-end
- **Authentication** — auth flows work with real credentials in the test environment

### Message Queue Integration
- **Message publishing** — messages are published with the correct payload and routing key
- **Message consumption** — messages are processed and acknowledged correctly
- **Dead letter queues** — failed messages are routed to the DLQ as expected
- **Ordering** — ordering guarantees hold where required

### End-to-End Workflows
- **Complete user journeys** — full business processes run without error
- **Data consistency** — data remains consistent across system boundaries
- **Cross-service communication** — services interact and hand off data correctly

## Infrastructure via Docker Compose + Jest (Node.js)

Use Docker Compose managed through Jest's `globalSetup`/`globalTeardown` hooks — the Node.js equivalent of the Gradle `docker-compose` plugin. Keep container lifecycle out of individual test files.

### Why Docker Compose over In-Code Containers

- **Decouples infrastructure from test code** — test files focus on behavior, not container lifecycle
- **Deterministic lifecycle** — Jest starts containers before any test runs and tears them down after all tests complete
- **Faster iteration** — skip teardown locally to reconnect to running containers between runs
- **Reusable** — same Compose file works for local development and CI

### Setup Pattern

**1. `docker-compose.integration.yml`** at the project root:
```yaml
services:
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      retries: 5
```

**2. `jest.integration.config.ts`** — separate Jest config for integration tests:
```ts
export default {
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
  testMatch: ['**/*.integration.test.ts'],
  testTimeout: 30000,
}
```

**3. `test/integration/global-setup.ts`** — start infrastructure:
```ts
import { execSync } from 'child_process'

export default async () => {
  execSync(
    'docker compose -f docker-compose.integration.yml up -d --wait',
    { stdio: 'inherit' }
  )
}
```

**4. `test/integration/global-teardown.ts`** — stop infrastructure:
```ts
import { execSync } from 'child_process'

export default async () => {
  if (process.env.CI) {
    execSync('docker compose -f docker-compose.integration.yml down', { stdio: 'inherit' })
  }
  // Locally: leave containers running for faster re-runs
}
```

**5. `package.json` scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:integration": "jest --config jest.integration.config.ts"
  }
}
```

### Connection Details

Because Docker Compose uses fixed ports declared in the Compose file, tests use the known port directly — no dynamic property injection needed (unlike Spring's `@DynamicPropertySource`):

```ts
const client = new MongoClient('mongodb://localhost:27017')
```

Use environment variables to vary this between local and CI if needed:

```ts
const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
```

### `--wait` Flag

The `--wait` flag (Compose V2) blocks until all services pass their `healthcheck`. This replaces manual retry logic or `wait-on` scripts. Requires Docker Compose V2 (`docker compose`, not `docker-compose`).
