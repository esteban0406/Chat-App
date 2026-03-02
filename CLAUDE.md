# Chat-App — Project Overview

A Discord-like real-time chat application. Three services: a NestJS backend, a Next.js frontend, and a Playwright e2e test suite. LiveKit handles voice/video rooms.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (localhost:3000)                               │
│  Next.js 16 + React 19 + Tailwind v4                   │
│  HTTP (fetch) ──────────────► /api/*                   │
│  WebSocket (socket.io) ─────► ws://backend:4000        │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  NestJS (localhost:4000)                                │
│  REST API prefix: /api                                  │
│  Socket.io gateway (same port)                         │
│  Prisma ORM → PostgreSQL                               │
│  LiveKit server SDK (voice token minting)              │
└─────────────────────────────────────────────────────────┘

LiveKit Cloud  ←  browser connects directly after receiving token
```

## How the Apps Communicate

- **HTTP**: Frontend calls `NEXT_PUBLIC_BACKEND_URL/api/*` with `Authorization: Bearer <jwt>`.
- **WebSocket**: Same base URL; token is passed as `socket.io` query param (`?token=...`). Backend verifies it in `handleConnection`.
- **Real-time events**: Backend emits targeted events to `user:<userId>` rooms (see gateway docs). Frontend listens via the `useNotificationSocket` hook.
- **Voice/video**: Frontend requests a LiveKit token from the backend, then connects directly to LiveKit Cloud.

## Running Everything

### Development (Docker)

```bash
# Start backend + frontend + livekit (hot-reload)
pnpm docker:up          # runs: docker compose up --build

# Shut down
docker compose down
```

Services:
| Service   | Host port | Notes                          |
|-----------|-----------|--------------------------------|
| backend   | 4000      | Node 24, pnpm start:dev        |
| frontend  | 3000      | Node 20, pnpm dev              |
| livekit   | 7880-7882 | LiveKit Cloud relay            |

### E2E Tests (Docker)

```bash
pnpm docker:test        # runs: docker compose -f docker-compose.yml -f docker-compose.test.yml up --build --exit-code-from e2e
```

This adds `postgres` + `e2e` (Playwright) services on top of the dev stack and waits for the e2e container to exit.

### Running Services Individually (no Docker)

Each sub-app has its own `pnpm` scripts — see the sub-project CLAUDE.md files.

## Environment Variables

Root `.env` holds LiveKit credentials shared between backend and docker-compose:

```
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

Backend reads its own `backend/.env` (or `backend/.env.test` in test mode).
Frontend reads `frontend/.env.local` (Next.js convention).

## CI/CD (`.github/workflows/`)

### Workflow Model: Gated PR → main

The pipeline uses a **gated** model. No one pushes directly to `main`; all changes go through a PR. Two separate workflows handle CI and CD:

- **`main.yml`** — triggers on `pull_request` targeting `main`. Runs all quality and test jobs as required status checks. Never runs on push to main.
- **`deploy.yml`** — triggers on `push` to `main` (i.e. after a PR merges). Builds production images and deploys to VPS. Never re-runs tests.

This split ensures each job runs exactly once: tests on the PR, build+deploy after merge.

### Job Stages

**`main.yml` — CI (pull_request to main)**
```
[quality-backend]──┐                          (parallel, Node 24 / Node 20)
                   ├──[unit-backend]──[integration-backend]
[quality-frontend]─┘
                   └──[unit-frontend]──[e2e]
```

**`deploy.yml` — CD (push to main)**
```
[build-images] ──► [deploy]
```

| Workflow | Job | Trigger | Notes |
|----------|-----|---------|-------|
| main.yml | **Quality · Backend** | PR only | ESLint + `tsc --noEmit`, Node 24 |
| main.yml | **Quality · Frontend** | PR only | ESLint + `tsc --noEmit`, Node 20 |
| main.yml | **Unit Tests · Backend** | PR only | Jest, needs quality-backend |
| main.yml | **Unit Tests · Frontend** | PR only | Jest, needs quality-frontend |
| main.yml | **Integration Tests · Backend** | PR only | NestJS e2e suite against a real Postgres service container |
| main.yml | **E2E Tests · Playwright** | PR only | Full stack via docker-compose |
| deploy.yml | **Build · Production Images** | push to main | Docker BuildKit with GHA layer cache |
| deploy.yml | **Deploy · VPS** | push to main | SSH → docker compose pull + up, needs build-images |

### Branch Protection (GitHub Settings)

`main` is protected with rules that enforce this flow:
- PRs required before merging.
- The following status checks must pass: `Quality · Backend`, `Quality · Frontend`, `Unit Tests · Backend`, `Unit Tests · Frontend`, `Integration Tests · Backend`, `E2E Tests · Playwright`.
- Branch must be up to date before merging.
- Auto-merge is enabled (Settings → General) so a PR auto-merges once all checks go green.

## Monorepo Layout

```
Chat-App/
├── backend/          # NestJS API + WebSocket gateway
├── frontend/         # Next.js client
├── e2e/              # Playwright tests
├── docker-compose.yml
├── docker-compose.test.yml
├── package.json      # root scripts only (pnpm workspaces not used for apps)
└── .github/workflows/main.yml
```

Package manager: **pnpm 10.x**. Each sub-project manages its own `node_modules`.
