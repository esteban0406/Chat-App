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

## CI/CD (`.github/workflows/main.yml`)

Pipeline stages (GitHub Actions):
1. **Quality** — ESLint + TypeScript type-check for backend and frontend (parallel, Node 24 / Node 20)
2. **Unit Tests** — Jest for both apps (after quality gate)
3. **Integration Tests** — Backend NestJS e2e against a real Postgres service container
4. **E2E Tests** — Full Playwright suite via docker-compose
5. **Build Verification** — Production Docker images built and layer-cached

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
