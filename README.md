<div align="center">
  <img src="frontend/app/icon.jpg" alt="Discol logo" width="480" />

  # Discol

  A Discord-inspired real-time chat application built with NestJS, Next.js, and LiveKit.

  [![CI](https://github.com/esteban0406/Chat-App/actions/workflows/main.yml/badge.svg)](https://github.com/esteban0406/Chat-App/actions/workflows/main.yml)
  ![Node Backend](https://img.shields.io/badge/node-24-green)
  ![Node Frontend](https://img.shields.io/badge/node-20-green)
  ![TypeScript](https://img.shields.io/badge/typescript-5-blue)
  ![pnpm](https://img.shields.io/badge/pnpm-10-orange)
</div>

---

## Features

- **Text channels** — Organize conversations in server-based text channels with real-time message delivery.
- **Voice & video rooms** — Join LiveKit-powered voice and video rooms directly inside a server channel.
- **Friend system** — Send and accept friend requests with instant Socket.io notifications.
- **Server management** — Create servers, invite members, and configure roles with granular permissions (`CREATE_CHANNEL`, `MANAGE_ROLES`, `INVITE_MEMBER`, and more).
- **Authentication** — Sign in with email/password or Google OAuth2. JWTs are issued on login and expire after 7 days.
- **Avatar uploads** — User avatars are stored and served via Cloudinary.
- **Real-time notifications** — A Socket.io gateway emits targeted events (friend requests, server invites, new messages) to individual users without broadcasting to everyone.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | NestJS 11, Prisma ORM, PostgreSQL |
| Real-time | Socket.io v4 |
| Voice / Video | LiveKit Cloud |
| Authentication | JWT, Google OAuth2, Passport.js |
| File storage | Cloudinary |
| Testing | Jest (unit), Supertest (integration), Playwright (e2e) |
| Package manager | pnpm 10 |

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

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [pnpm](https://pnpm.io/installation) 10.x
- Environment variable files (see [Environment Variables](#environment-variables) below)

### Run with Docker (recommended)

The fastest way to get everything running — backend, frontend, and a LiveKit relay — with hot-reload:

```bash
pnpm docker:up
```

| Service | Host port | Notes |
|---|---|---|
| frontend | 3000 | Next.js dev server with HMR |
| backend | 4000 | NestJS watch mode |
| livekit | 7880–7882 | LiveKit Cloud relay |

> [!NOTE]
> `pnpm docker:up` tears down existing volumes before starting, giving you a clean state every time.

### Run locally (without Docker)

Each sub-project manages its own dependencies and scripts. See the sub-project documentation for details:

- **Backend** — `backend/CLAUDE.md` (`pnpm start:dev`, port 4000)
- **Frontend** — `frontend/CLAUDE.md` (`pnpm dev`, port 3000)

## Environment Variables

Three separate env files are required. Copy and fill in your own values.

<details>
<summary><strong>Root <code>.env</code></strong> — LiveKit credentials (shared by docker-compose)</summary>

```env
LIVEKIT_URL=wss://your-livekit-app.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

</details>

<details>
<summary><strong><code>backend/.env</code></strong> — Database, auth, and third-party services</summary>

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/discol

JWT_SECRET=change-me-in-production

FRONTEND_URL=http://localhost:3000
PORT=4000

# Google OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Cloudinary (avatar uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# LiveKit (voice token minting)
LIVEKIT_URL=wss://your-livekit-app.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

</details>

<details>
<summary><strong><code>frontend/.env.local</code></strong> — Backend URL for API and WebSocket</summary>

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

</details>

## Running Tests

```bash
# Full E2E suite (Playwright) — spins up the entire stack in Docker
pnpm docker:test

# Backend unit tests
cd backend && pnpm test

# Backend integration tests (NestJS + real Postgres)
cd backend && pnpm test:e2e

# Frontend unit tests
cd frontend && pnpm test

# Playwright in interactive UI mode (local)
cd e2e && pnpm test:ui
```

> [!TIP]
> E2E tests reset the database before each spec file via `POST /api/test/reset`, which is only registered when `NODE_ENV=test`.

## CI/CD

The pipeline uses a gated model — no direct pushes to `main`. All changes go through a pull request.

| Workflow | Trigger | Jobs |
|---|---|---|
| `main.yml` | Pull request → `main` | Quality (lint + type-check) → Unit tests → Integration tests → E2E tests |
| `deploy.yml` | Push to `main` (after PR merge) | Build Docker images → Deploy to VPS via SSH |

```
[quality-backend]──┐
                   ├──[unit-backend]──[integration-backend]
[quality-frontend]─┘
                   └──[unit-frontend]──[e2e]
```

> [!NOTE]
> All status checks must pass before a PR can merge. Auto-merge is enabled — once all checks go green the PR merges automatically.

## Project Structure

```
Chat-App/
├── backend/          # NestJS API + Socket.io gateway
│   ├── src/
│   │   └── modules/  # auth, users, servers, channels, messages, livekit, gateway
│   └── prisma/       # schema.prisma + migrations
├── frontend/         # Next.js client
│   ├── app/          # App Router: (auth) and (main) route groups
│   ├── ui/           # React components organised by feature
│   └── lib/          # Utilities, contexts, socket singleton
├── e2e/              # Playwright test suite
│   └── tests/        # auth, messaging, channels, friends, servers, roles…
├── .github/
│   └── workflows/    # main.yml (CI), deploy.yml (CD)
├── docker-compose.yml
└── docker-compose.test.yml
```
