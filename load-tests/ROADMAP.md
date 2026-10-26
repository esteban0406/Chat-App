# Roadmap: where we are and what's next

The work is done phase by phase. Each phase ends with a run, and we review the results together
before moving on. The theory is in [README.md](README.md); the results go in [FINDINGS.md](FINDINGS.md).

## Status

| Phase | What | Status |
|---|---|---|
| 0 | Setup: stack, seed, throttle env vars, dashboards, docs | ✅ Done 2026-10-22 |
| 1 | k6 Studio exploration (you: record, generate, validate) | ✅ Done 2026-10-25 (request count and journey decisions in FINDINGS.md) |
| 2 | Shared k6 library, user journey, smoke test | ✅ Done 2026-10-25 (smoke passes, see FINDINGS.md) |
| 3 | Load test (baseline) | ⏭ **Next**: redo the traffic hypothesis first (a session is ~15 s / ~138 requests) |
| 4 | Stress test (+ breakpoint variant) | ⬜ |
| 5 | Spike test | ⬜ |
| 6 | Soak test | ⬜ |
| 7 | WebSocket (socket.io) scenario, then rerun load and soak mixed | ⬜ |
| 8 | Tuning loop: one change at a time, compare against the baseline (optional) | ⬜ |

## Resuming a session

```bash
cd load-tests
./run.sh up        # start the stack (data is kept between sessions)
./run.sh seed      # only if you want to reset the data
curl localhost:4001/api/health
```

Grafana: http://localhost:3001 (the "Test run" dropdown also shows a `pipeline-check` run from
setup; ignore it). Stop everything with `./run.sh down`.

---

## Decisions already made

| Topic | Decision | Why |
|---|---|---|
| Load generator | k6 (v1.8.2) | Playwright drives real browsers (~100–300 MB per user), so it can't generate backend load. It comes back later as k6 browser / hybrid tests for the frontend. |
| Rate limiter | `THROTTLE_LIMIT` / `AUTH_THROTTLE_LIMIT` env vars, lifted only in the load-test stack | All VUs share one IP. With the defaults we'd only measure 429s. |
| System under test | Production image, **1 CPU / 1 GB**, isolated Postgres | Dev mode numbers are meaningless; the limits make the breaking point reachable and reproducible. |
| Dashboards | k6 web dashboard + HTML report per run, plus Prometheus/Grafana with cAdvisor and postgres-exporter | Client side (RED) next to server side (USE) |
| Percentiles | k6 → Prometheus as **native histograms** | Correct p95 per time window. The default mode pre-computes percentiles that can't be re-aggregated. |
| k6 Studio | Used to create and debug scripts, not to chart runs | That is what it is built for |

## Phase 1: k6 Studio (your part)

Use the **dev stack** (`docker compose up`, frontend on :3000 → backend :4000).
⚠ `pnpm docker:up` runs `docker compose down -v`, which **wipes the dev DB**. Use
`docker compose up -d` if you want to keep it.

1. **Recorder**: start a recording, log in at `localhost:3000`, open a server and a channel,
   scroll up through the history, send a message, stop.
2. **Count the API calls the frontend made to open one channel.** Write the number in
   FINDINGS.md. It tells us whether our journey in Phase 2 is realistic.
3. **Generator**: allow only `localhost:4000`. Add a **correlation rule**: extract `accessToken`
   from the `POST /api/auth/login` response and inject it as `Authorization: Bearer <token>`. Add
   a verification rule (status 2xx). Export the script to `load-tests/studio/`.
4. Look for the message you sent: it is **not** in the recording, because it went over
   WebSocket. That is why Phase 7 exists.
5. **Validator**: run the exported script once and inspect each request and response.

## Phase 2: Shared library and smoke test (next coding step)

Files to create:

| File | Content |
|---|---|
| `lib/config.js` | `BASE_URL` (default `http://localhost:4001`), `WS_URL` |
| `lib/thresholds.js` | Shared SLOs (below) |
| `lib/api.js` | REST helpers. Each sets a `name` tag (e.g. `GET /api/messages/channel/:id`) so URLs with UUIDs are grouped, and runs checks. The avatar helper treats 200–399 **and 404** as expected (`http.expectedStatuses`), so "no avatar yet" doesn't count in `http_req_failed`, and uses `redirects: 0` so k6 never follows a redirect to Cloudinary. |
| ~~`lib/summary.js`~~ | Replaced by `--summary-export results/<testid>.json` in `run.sh`: same JSON, keeps k6's own summary, no remote jslib import |
| `scenarios/chat-user.js` | The REST journey, with 1–3 s think time between steps |
| `scenarios/login.js` | Low-rate `POST /api/auth/login` (bcrypt cost) |
| `tests/smoke.js` | 1 VU, 1 min. Must pass with 0 errors before anything else runs. |

- **`setup()`**: log in `lt_user_1..200` and return their tokens. Each VU picks one by `__VU`.
  Discover the server and channel IDs through the API (`GET /api/servers`, find
  "Load Test Server"), the same way the frontend does.
- **Journey: one iteration = one user session.** It mirrors what the frontend does (Phase 1
  findings), with 1–3 s of think time between steps:
  1. **App load, once:** `GET /api/auth/me`, `GET /api/friendships` (login lands on `/home`),
     `GET /api/servers` (the channel list comes embedded here, so there is no
     `/servers/:id/channels` call), and the user's own avatar.
  2. **Visit a random channel (of the 5), 3 times:**
     1. `GET /api/messages/channel/:id`, with no query string, like the frontend.
     2. `http.batch()` of `GET /api/users/:id/avatar` for each distinct author in the response,
        the way the browser loads the images in parallel.
     3. With probability `PAGINATION_RATIO` (default 0.3): the older page using `nextCursor`,
        tagged `GET /api/messages/channel/:id (older page)`, then a batch of avatars for authors
        not seen yet. The frontend can't do this today; the step models planned behavior and
        its cost shows up separately.
     4. `POST /api/messages {content, channelId}`.
- **Seed fact:** 50 consecutive messages in a channel come from 50 distinct authors, and the
  older page brings the other 50 (authors repeat every 100 messages). So one channel visit
  costs ~51 requests, or ~101 with the older page. No seed user has an avatar, so all are 404s.
- **Starting thresholds** (`lib/thresholds.js`), latency **per endpoint** (`name` tag), not
  aggregated: in the first smoke run the aggregate p95 was 14 ms while the older page sat at
  250 ms, because ~90% of requests are fast avatar 404s (decided 2026-10-26).

  | Metric | Load, stress, spike, soak | Smoke |
  |---|---|---|
  | `http_req_failed` | rate < 1% | rate == 0 |
  | `checks` | rate > 99% | rate == 1 |
  | `http_req_duration{name:…}`, each endpoint | p95 < 300 ms, p99 < 800 ms | printed, never fails |
  | `http_req_duration{name:POST /api/auth/login}` | p95 < 1000 ms | printed, never fails |

  Smoke only answers "is the script correct?", so a known slow endpoint can't fail it. Setup
  logins are named `POST /api/auth/login (setup)` and count against no SLO. An endpoint with no
  requests in a run (e.g. `PAGINATION_RATIO=0`) reports 0 s and passes.

## Phases 3–6: The four tests

All four reuse the same scenarios and only change `options.scenarios`.

**Working "normal traffic" hypothesis:** 200 active users each finishing a journey about every
20 s, which is about **10 iterations/s**, plus 1 login/s. Every number below is a starting point
that we adjust after smoke and load.

⚠ These rates were set when an iteration was one short journey. Now that an iteration is a whole
session (app load + 3 channel visits, ~150+ requests), recompute the rate with Little's law once
the smoke test has measured how long an iteration takes.

| Test | Executor and shape | Hypothesis to confirm or reject |
|---|---|---|
| Load | `ramping-arrival-rate` 0→10 it/s over 2 min, hold 10 min, ramp down 1 min | Passes. `GET /api/servers` is the slowest read. Becomes the baseline. |
| Stress | Steps of 10→20→40→60→80→100 it/s, 3 min each, then ramp down; plus a `breakpoint` variant with `abortOnFail` | (a) CPU is pinned at 1.0 and every endpoint slows together, or (b) CPU < 1.0 while "active" DB connections sit at 10 (pool queueing). Login breaks first (~80 ms of bcrypt each → ~12/s per core). |
| Spike | 2 it/s for 1 min → 60 it/s within 10 s, hold 1 min → 2 it/s for 3 min | The pool has no acquire timeout, so latency balloons instead of failing fast. Measure the time to recover. |
| Soak | Constant 8 it/s for 60 min (`SOAK_DURATION` for longer), **no reseed** during the run | p95 of message history drifts upward as `Message` grows (no index on `channelId, createdAt`). Watch memory for leaks. |

## Phase 7: WebSocket

- k6 has no socket.io client, so we speak Engine.IO v4 over raw WebSocket:
  1. Connect to `ws://localhost:4001/socket.io/?EIO=4&transport=websocket&token=<JWT>`.
  2. Send `40` to join the namespace.
  3. Answer each ping `2` with a pong `3`.
  4. Events look like `42["joinChannel","<channelId>"]` and
     `42["message",{"channelId","senderId","text"}]`.
- The server broadcasts `message` to the channel room.
- **Custom metrics**:
  - `ws_message_roundtrip` (Trend): time from emit until the sender's own echo arrives, matched by
    a nonce.
  - `ws_messages_received` (Counter): measures fan-out.
- Use `ramping-vus`: one VU is one connection.

## Phase 8: Tuning candidates (one at a time)

1. `@@index([channelId, createdAt])` on `Message`.
2. Make the pool size configurable (`DB_POOL_MAX`).
3. Measure the cost of the request-body logger.
4. `UV_THREADPOOL_SIZE` for bcrypt (*lesson:* useless on 1 CPU).
5. `prom-client` `/metrics` for event-loop lag and heap.
6. Avatars: render `author.avatarUrl` (already in every message) directly in the frontend, with a
   fallback when it's null, instead of requesting `/api/users/:id/avatar` per author. Also decide
   what that endpoint should return when there's no avatar, instead of 404.
7. CORS `maxAge` on `enableCors`, so the browser stops sending a preflight before most API calls
   (browser-side gain; k6 won't show it).

---

## Backend facts the scripts rely on

| Fact | Where |
|---|---|
| Login: `POST /api/auth/login {email, password}` → `{ user, accessToken }`. Seed users are `lt_user_N@test.com` / `password123`. | `backend/src/modules/auth/auth.controller.ts` |
| JWT guard does **no DB lookup**; tokens last 7 days | `backend/src/modules/auth/strategies/jwt.strategy.ts` |
| Message history: `GET /api/messages/channel/:id?limit&cursor` → `{ messages, nextCursor, hasMore }` (messages in chronological order). Default limit 50, **no max cap**. | `backend/src/modules/messages/messages.service.ts:58-92` |
| REST `POST /api/messages` saves but does **not** broadcast. The UI sends messages over WebSocket. | `messages.controller.ts`, `chat.gateway.ts:123-150` |
| `GET /api/servers` loads every member, role and channel: the heaviest read. The frontend takes the channel list from here. | `backend/src/modules/servers/servers.service.ts:56-86` |
| Message history includes `author { id, username, avatarUrl, status }` for each message | `backend/src/modules/messages/messages.service.ts:69-82` |
| `GET /api/users/:id/avatar` needs no auth: one user lookup, then 404 (no avatar) or a redirect to Cloudinary | `backend/src/modules/users/users.controller.ts:78-88` |
| `pg` pool = 10 connections (default), no acquire timeout | `backend/src/database/prisma.service.ts` |
| Every request and its body is logged | `backend/src/common/middleware/logger.middleware.ts` |

## Setup observations (Phase 0 sanity checks)

- One login on the 1-CPU backend took **~80 ms**, almost all of it bcrypt (cost 10).
- 2 VUs with **no think time** on `/api/health` produced **~5,700 req/s**. This shows how a
  closed model without think time is not realistic, and that a trivial endpoint says nothing about
  real ones.
- After a run ends, k6 series are marked stale (`K6_PROMETHEUS_RW_STALE_MARKERS=true`), so query
  them over a time range (`max_over_time(...[5m])`), not at an instant.

## Out of scope: security issues found during exploration

Not fixed here; worth a separate PR:

- The WebSocket `message` handler trusts `senderId` from the client, so anyone can post as any
  user (`chat.gateway.ts:123`).
- `joinChannel` has no membership check, and unauthenticated sockets aren't disconnected.
- `GET /api/users` requires no authentication and returns every user's email.
