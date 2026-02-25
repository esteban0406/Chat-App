# E2E Tests — Playwright

Full-stack browser tests against the running frontend + backend stack. Workers are serialized (1 at a time) and the database is wiped before every test file.

## Running Tests

### Inside Docker (recommended, matches CI)

From the repo root:
```bash
pnpm docker:test
```
This starts postgres + backend + frontend + e2e containers and streams the Playwright output.

### Locally (without Docker)

Requires a running backend (port 4000) and frontend (port 3000):
```bash
pnpm test                       # headless
pnpm test -- --ui               # Playwright UI mode
pnpm test -- --headed           # headed (see browser)
pnpm test -- tests/auth.spec.ts # single file
```

## Project Structure

```
e2e/
├── tests/                      # Spec files (one feature per file)
│   ├── auth.spec.ts
│   ├── channels.spec.ts
│   ├── friends.spec.ts
│   ├── messaging.spec.ts
│   ├── navigation.spec.ts
│   ├── roles.spec.ts
│   ├── server-invites.spec.ts
│   ├── servers.spec.ts
│   └── user-profile.spec.ts
├── helpers/
│   ├── api.ts                  # Typed API helpers (createServer, sendFriendRequest, …)
│   ├── auth.ts                 # User registration helpers
│   ├── db.ts                   # resetDB() — calls POST /api/test/reset
│   └── fixtures.ts             # Custom Playwright fixtures (loginViaUI, etc.)
├── global-setup.ts             # Runs resetDB() once before the entire suite
├── playwright.config.ts
├── Dockerfile
└── package.json
```

## Key Conventions

### Database Reset
Every spec file calls `resetDB()` in a `test.beforeAll`:
```typescript
test.beforeAll(async () => {
  await resetDB();
});
```
`resetDB()` hits `POST /api/test/reset` on the backend (only available when `NODE_ENV=test`). This gives each file a clean slate without restarting containers.

### API Helpers (`helpers/api.ts`)
Use these instead of raw `fetch` to set up test state. They all accept a JWT token as the first argument:
```typescript
const server = await createServer(token, "My Server");
const channel = await createChannel(token, server.id, "general", "TEXT");
const req = await sendFriendRequest(token, otherUserId);
await acceptFriendRequest(otherToken, req.id);
const invite = await sendServerInvite(token, server.id, otherUserId);
await acceptServerInvite(otherToken, invite.id);
const role = await createRole(token, server.id, "Mod", "#ff0000", [Permission.MANAGE_ROLES]);
```

Prefer these over UI interactions for test **setup**. Only use the browser for the actions you actually want to assert.

### Auth Fixtures (`helpers/fixtures.ts`)
Custom fixtures provide logged-in page contexts:
```typescript
test("…", async ({ loginViaUI }) => {
  const { page, user } = await loginViaUI();
  // page is already authenticated
});
```

### Test Configuration (`playwright.config.ts`)
| Setting | Value |
|---------|-------|
| `baseURL` | `BASE_URL` env (default `http://localhost:3000`) |
| `BACKEND_URL` | `http://localhost:4000` (or `http://backend:4000` in Docker) |
| `workers` | 1 (serial — tests share one DB) |
| `retries` | 2 in CI, 0 locally |
| `timeout` | 60 s per test |
| `screenshot` | only-on-failure |
| `trace` | on-first-retry |

### Locator Strategy
Prefer semantic selectors in priority order:
1. `getByRole('button', { name: '…' })`
2. `getByPlaceholder('…')`
3. `getByLabel('…')`
4. `getByText('…')`
5. `locator('[data-testid="…"]')` (last resort, add to frontend if needed)

Avoid CSS class selectors — they change with styling refactors.

### Waiting for Navigation
Use `await expect(page).toHaveURL(/pattern/)` rather than arbitrary `page.waitForTimeout(...)`. If an action triggers a network request, `await page.waitForResponse(...)` or `await expect(locator).toBeVisible()` are preferred.

## Environment Variables

```
BASE_URL=http://localhost:3000       # frontend URL
BACKEND_URL=http://localhost:4000    # backend URL (used by api helpers)
DOCKER=true                         # set by docker-compose.test.yml
```

In Docker, hostnames become service names (`frontend`, `backend`) instead of `localhost`.

## CI Behaviour

The GitHub Actions pipeline runs the e2e stage with `docker-compose.test.yml`, which:
1. Starts postgres (healthy) → backend (migrations + healthy) → frontend (healthy) → e2e.
2. Playwright HTML report is uploaded as a workflow artifact on failure.
