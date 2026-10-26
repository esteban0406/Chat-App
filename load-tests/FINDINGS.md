# Load-test findings

What the workload tests revealed about the Chat-App backend, run by run.
How the tests work and how to run them: [README.md](README.md).

## Test environment

| | |
|---|---|
| Backend | Production image (`node dist/main`), Node 24, **1 CPU / 1 GB** container limit |
| Database | Postgres 16, 1 CPU / 1 GB, app pool = 10 connections (pg default) |
| Dataset | 500 users, 1 server, 5 channels, 200k messages (`seed/seed.sql`) |
| Load generator | k6 v1.8.2 on the same machine (12 cores, 15 GB RAM) |
| Rate limiter | Lifted via `THROTTLE_LIMIT` / `AUTH_THROTTLE_LIMIT` (all VUs share one IP) |

## Starting SLOs

| Metric | Target |
|---|---|
| Error rate | < 1% |
| p95 / p99 latency, **each endpoint** | < 300 ms / < 800 ms |
| p95 login (bcrypt) | < 1000 ms |

## Summary

_Filled in as the tests are run._

| Test | testid | Result | Key number |
|---|---|---|---|
| Smoke | `smoke-20261025-234747` | ✅ Pass, 0 errors | Older-page history read: p95 **250 ms with 1 VU** (full table scan) |
| Load #1 | `load-20261026-005108` | ❌ older page p95 395 ms. ⚠ Not valid as the baseline (20-identity bug) | 35 req/s, 21% backend CPU, tails 5–35× the idle values |
| **Load #2 (baseline)** | `load-20261026-011311` | ❌ older page p95 405 ms, everything else passes | 50 sessions/min = 61 req/s. Backend 22% / Postgres 27% CPU |
| Stress | | | |
| Spike | | | |
| Soak | | | |

---

## Phase 1: what the frontend actually requests (2026-10-25)

Captured in the browser's Network tab on the dev stack (`:3000` → `:4000`): log in, land on
`/home`, get redirected to the first server, open `#general`, send a message. **25 requests.**

| Request | Count | Served by |
|---|---|---|
| `POST /api/auth/login` | 1 + 1 preflight | backend |
| `GET /api/auth/me` (session check in `app/(main)/layout.tsx`) | 2 + 1 preflight | backend |
| `GET /api/friendships` (`FriendsProvider`, only mounted under `/home`) | 2 + 2 preflights | backend |
| `GET /api/servers` (`ServersProvider`) | 2 + 2 preflights | backend |
| `GET /api/messages/channel/:id` (`useMessages`) | 2 + 2 preflights | backend |
| `GET /api/users/:id/avatar` | 3, all 404 | backend |
| socket.io WebSocket | 1 | backend |
| Next.js RSC payloads (`?_rsc=`) for `/home`, the server page, the channel page | 4 | Next.js |
| **Total** | **25** | 20 backend HTTP + 1 WebSocket + 4 Next.js |

**Opening one channel** (click server → messages visible) costs **1 API call** in a production
build, `GET /api/messages/channel/:id`, plus **one avatar request per distinct author on screen**.
No `GET /api/servers/:id/channels`: the channel list arrives embedded in `GET /api/servers`.

### Why the numbers look like this

1. **Every call shows up twice: React Strict Mode (dev only).** Next.js dev runs each effect twice.
   Proof: `CurrentUserProvider` receives `initialUser` and never fetches, so the layout's effect is
   the only caller of `/api/auth/me`, and it still fired twice. A production build fires each once:
   login → app = **5 API calls** (login, me, friendships, servers, messages) plus avatars.
2. **Preflights (`OPTIONS`).** `:3000` and `:4000` are different origins and the requests carry
   `Authorization`, so the browser asks permission before each one. `enableCors` sets no `maxAge`,
   so Chrome keeps the answer only 5 s, which means close to one OPTIONS per API call. They're cheap
   (answered by the CORS middleware, no guard, no DB), and k6 never sends them because it isn't a
   browser. Phase 8 candidate: `maxAge: 600`.
3. **Avatars are the hidden cost.** `ChatMessages` renders
   `<img src="/api/users/:authorId/avatar">` for each message. Each one is a `findUnique` on `User`,
   then a 404 (no `avatarUrl`) or a redirect to Cloudinary. Your dev channel only had 2 authors. In
   the seeded channels, 50 consecutive messages have **50 distinct authors** (author =
   `(g·7919) mod 500`, which moves by 95 per message within a channel and repeats after 100), and
   none have an avatar. So opening a seeded channel = **1 history call + ~51 avatar calls**. The
   avatars outnumber everything else.
4. **No pagination in the UI.** `useMessages` calls the history endpoint without `limit` or
   `cursor` (server default 50) and never loads older pages. Scrolling up made no requests.
5. **The message you sent isn't in the list.** It went as a socket.io frame inside the WebSocket
   (the `socket.io/?token=…` row, Messages tab), not as `POST /api/messages`. → Phase 7.
6. **Friendships only load under `/home`.** `FriendsProvider` lives in `home/layout.tsx`. It ran
   because login lands on `/home` before redirecting to the first server.

### k6 Studio recording confirms it

The same flow recorded in k6 Studio gave **12 requests** = the 20 backend calls above minus the
8 preflights (the recorder never sees `OPTIONS`). The second `/api/auth/me` came back **304**:
the browser sent the ETag from the first response and nothing had changed.

### Decided for the Phase 2 journey (2026-10-25)

| Planned step | What the frontend does | Decision |
|---|---|---|
| `GET /api/servers` | ✓, once at app load | keep, once per session |
| `GET /api/servers/:id/channels` | never calls it: channels come embedded in `GET /api/servers`, and changes arrive over WebSocket | **dropped** |
| `GET /api/messages/channel/:id?limit=50` | ✓ (no query string, default 50) | keep, without the query string |
| 30%: older page via `nextCursor` | never (see below) | **kept** as a model of planned behavior, own `name` tag, ratio set by `PAGINATION_RATIO` |
| `POST /api/messages` | sends over WebSocket instead | keep as a stand-in for the DB write until Phase 7 |
| — | `GET /api/auth/me` on every app load | **added** |
| — | `GET /api/friendships`, because login lands on `/home` | **added** |
| — | `GET /api/users/:id/avatar` × distinct authors | **added**, in parallel with `http.batch()`. 404 counts as expected. |

One iteration = **one session**: load the app once, then visit 3 channels. Switching channels
never re-fetches `/api/servers`, so reloading the app every iteration would over-weight the
heaviest read.

### App findings (to fix later, not during load testing)

- **The frontend can't load older messages.** `useMessages` never sends a `cursor`, so users
  only ever see the last 50 messages of a channel, even though the API supports pagination.
- **Avatars ignore data the frontend already has.** Every message includes `author.avatarUrl`
  (`messages.service.ts:72-74`), but `ChatMessages.tsx` requests `/api/users/:id/avatar` for
  each author anyway, and gets a 404 for "no avatar yet", which is a normal case. Rendering
  `avatarUrl` (or a fallback when it's null) would remove ~50 backend requests per channel
  open. Candidate for Phase 8, measured against the baseline.

---

## Run log

Copy this block for each run.

### Smoke — `smoke-20261025-234747`

- **Commit:** `9ebe570` + the uncommitted Phase 2 files (`lib/`, `scenarios/`, `tests/smoke.js`)
- **Config:** `chat`: `constant-vus`, 1 VU, 1 min (`CHANNEL_VISITS=3`, `PAGINATION_RATIO=0.3`).
  `login`: 1 login every 10 s. Fresh seed. The dev stack was running on the same machine, which
  doesn't matter for a correctness check.
- **Hypothesis:** the script is correct, so every request succeeds and every check passes.
- **Result:** ✅ confirmed (same result as the first run, `smoke-20261025-234526`). 698 requests,
  0 failed, 724/724 checks.

  | Endpoint | avg | p95 |
  |---|---|---|
  | `GET /api/messages/channel/:id (older page)` | 220 ms | **250 ms** |
  | `GET /api/messages/channel/:id` | 27 ms | 29 ms |
  | `GET /api/servers` | 16 ms | 22 ms |
  | `GET /api/friendships` | 5 ms | 5 ms |
  | `POST /api/messages` | 5 ms | 7 ms |
  | `GET /api/users/:id/avatar` | 4 ms | 5 ms |
  | `GET /api/auth/me` | 2 ms | 2 ms |
  | `POST /api/auth/login` | 60 ms | 71 ms |

- **Server side:** `pg_stat_statements`: the older-page query averages ~136 ms in Postgres alone.
  `EXPLAIN` shows a **parallel sequential scan of all 200k messages** for both pages: `Message`
  has no index except the primary key. The latest page uses a cheap top-N sort. The older page
  adds Prisma's cursor subquery (`createdAt <= (SELECT createdAt … WHERE id = cursor)`) and costs
  4–8× more.
- **Conclusion:**
  1. The script works. Phase 3 can start.
  2. The missing `(channelId, createdAt)` index (Phase 8 candidate #1) already shows up with
     **one user**. Under load, every history read competes for Postgres's single CPU.
  3. **An aggregate percentile hides a slow endpoint.** `http_req_duration{kind:api}` p95 was
     14 ms because ~90% of requests are fast avatar 404s. The older page is ~2% of requests, so it
     barely moves the aggregate. → **Thresholds are now per endpoint** (decided 2026-10-26).
     Smoke reran with them: `smoke-20261026-004045`, pass, 0 errors.
  4. **Numbers for Phase 3 (Little's law):** one session takes **~15 s** (`iteration_duration
     {scenario:chat}`) and sends **~138 requests**, so the old "10 iterations/s" target would mean
     ~1,400 req/s and ~150 busy VUs. The traffic hypothesis has to be redone with these numbers.

### Load (baseline) — hypothesis, written before the run

- **Traffic (decided 2026-10-26):** a busy evening. 100 of the 500 members online, each doing a
  session about every 2 min → **50 sessions/min ≈ 115 req/s**, ~14 VUs busy, plus 3 logins/min.
  Rough capacity from the smoke numbers is ~200 sessions/min, so this is ~25% of it.
- **Expected:**
  1. Every endpoint meets its SLO **except the older page**. It already sat at p95 285 ms with
     no load, and every history read is a full scan competing for Postgres's single CPU. Expect
     it to cross 300 ms, so the test fails on that one threshold.
  2. Backend CPU ~15–25% of its core, Postgres CPU ~20–30%. Active DB connections well below 10.
  3. `dropped_iterations` = 0, error rate 0, memory flat.

### Load #1 — `load-20261026-005108` (not valid as the baseline)

- **Commit:** `b4c6b20` + `tests/load.js`
- **Config:** `chat`: `ramping-arrival-rate` 0→50 sessions/min over 2 min, hold 10 min, ramp down
  1 min. `login`: 3/min. 100 tokens from setup. Fresh seed, dev stack stopped.
- **Result:** ❌ 1 threshold failed: the older page, p95 **395 ms**. 28,008 requests, 0 failed,
  0 dropped iterations. 574 sessions (50/min, as configured). Busy VUs peaked at 16 (Little's
  law predicted 14). One session took 16.3 s on average.

  | Endpoint | p95 idle (smoke) | p95 under load | median under load |
  |---|---|---|---|
  | `GET /api/messages/channel/:id (older page)` | 250 ms | **395 ms** ✗ | 203 ms |
  | `GET /api/messages/channel/:id` | 29 ms | 158 ms | 26 ms |
  | `POST /api/messages` | 7 ms | 124 ms | 5 ms |
  | `GET /api/auth/me` | 2 ms | 71 ms | 2 ms |
  | `GET /api/servers` | 22 ms | 61 ms | 12 ms |
  | `GET /api/users/:id/avatar` | 5 ms | 27 ms | 3 ms |
  | `GET /api/friendships` | 5 ms | 9 ms | 3 ms |
  | `POST /api/auth/login` | 71 ms | 203 ms | 58 ms |

- **Server side (10-min hold):** backend CPU 0.21 core on average (max 0.25), Postgres 0.26 (max
  0.30). Despite that, the backend was **CPU-throttled in ~12% of its 100 ms periods** and
  Postgres in ~7%. Active DB connections peaked at 3 (sampled every 15 s). Backend memory went
  from 207 to 255 MB.
- **Conclusion:**
  1. Expected results 1–3 held: only the older page fails, CPU landed in the predicted range, and
     there were no errors or dropped iterations. Memory wasn't flat (+50 MB): warm-up or a leak,
     which the soak test will tell apart.
  2. **The request volume was wrong: 35 req/s, not 115.** The rate of sessions was right, but each
     session sent ~49 requests instead of ~140, because avatars fell from ~120 to ~39 per
     session. Two reasons:
     - **The test changes the data it reads.** 1,722 posted messages (~340 per channel) pushed the
       seed messages out of the latest pages. That part is realistic: in a busy server, recent
       messages come from the users who are active.
     - **A script bug: only 20 users ever posted.** Sessions picked their user by VU number, and the
       arrival-rate executor only needed ~20 VUs. **In an open model, a VU is a worker, not a
       person.** Fixed: each session now picks a random one of the 100 online users.
  3. **Medians barely moved, but tails grew 5–35×, at only ~21% average CPU.** The likely cause is
     throttling. A CPU limit is enforced per 100 ms period. Bursts (6 parallel avatar requests per
     session, several sessions overlapping) use up the quota early in a period, and every other
     request waits for the next one. A one-minute CPU average can't show saturation that lasts
     milliseconds. Postgres adds its own bursts: each full-scan query runs as 3 processes (leader
     + 2 parallel workers) sharing one CPU's quota.
  4. Not valid as the baseline because of the 20-identity bug. Rerun with the fix.
  5. **Updated capacity estimate for the stress test:** ~250 ms of backend CPU and ~310 ms of
     Postgres CPU per session. So **Postgres should saturate first, at ~190 sessions/min**.

### Load #2 — hypothesis, written before the run

Same config, with the fix (each session picks a random one of the 100 online users).

1. Requests per session land between run #1 (~49) and smoke (~140). With 100 identities posting,
   the latest pages have more distinct authors, so more avatar requests: roughly 60–80 per
   session, ~50–65 req/s.
2. The older page still fails its threshold (it doesn't depend on avatars). Everything else
   passes.
3. CPU a bit above run #1 on the backend (more avatars), about the same on Postgres (same number
   of history reads). Throttling and the gap between median and tail stay.

### Load #2 — `load-20261026-011311` ⭐ baseline

- **Commit:** `b4c6b20` + the fix (random online user per session) + `tests/load.js`
- **Config:** same as run #1. Fresh seed, dev stack stopped.
- **Result:** ❌ 1 threshold failed: the older page, p95 **405 ms**. 48,797 requests, 0 failed,
  0 dropped iterations, **61 req/s**. 575 sessions with **~85 requests each** (~75 of them
  avatars). 100 distinct users posted. Busy VUs ≤ 16, one session took 16.0 s.

  | Endpoint | p95 | median | Response size |
  |---|---|---|---|
  | `GET /api/messages/channel/:id (older page)` | **405 ms** ✗ | 163 ms | ~20 KB |
  | `GET /api/messages/channel/:id` | 154 ms | 26 ms | ~20 KB |
  | `POST /api/messages` | 128 ms | 5 ms | |
  | `GET /api/servers` | 69 ms | 12 ms | **270 KB** |
  | `GET /api/auth/me` | 64 ms | 2 ms | 210 B |
  | `GET /api/users/:id/avatar` | 39 ms | 3 ms | 65 B |
  | `GET /api/friendships` | 9 ms | 2 ms | |
  | `POST /api/auth/login` | 246 ms | 56 ms | |

- **Server side (10-min hold):** backend CPU 0.215 core (max 0.26; ~0 when idle), Postgres 0.27
  (max 0.29). CPU-throttled in 15% of the backend's periods and 9% of Postgres's. Active DB
  connections peaked at 6. Memory: backend 191 → 230 MB, Postgres 190 → 213 MB.
  `pg_stat_statements`:

  | Query | Calls | Mean | Total DB time |
  |---|---|---|---|
  | Latest history page | 1,725 | 28 ms | 48 s |
  | Older history page | 473 | 100 ms | 48 s |
  | User lookup (avatars) | 43,723 | 0.03 ms | 1.5 s |

- **Hypotheses:** 1 ✓ (85 requests per session, 61 req/s). 2 ✓. 3 ✗: backend CPU **did not
  rise**, although avatar requests doubled (22k → 43k).
- **Conclusion:**
  1. **This is the baseline.** At expected peak traffic, every endpoint meets its SLO except the
     older page, and the cause is known: a full table scan, no index.
  2. **Request count isn't cost.** Avatars doubled with no change in backend CPU, and Postgres
     spent 1.5 s on all 43,723 of them. Per request they are nearly free. Their real costs are the
     bursts (tail latency) and, in production, the browser and network. So the Phase 8 avatar
     change should reduce request count and bursts more than CPU. It also means the logger
     middleware's per-request cost is small, since it logs avatars too (Phase 8 candidate #3 looks
     low value).
  3. **The older page is 22% of history reads but half of their DB time.** One
     `(channelId, createdAt)` index should fix both pages.
  4. **The backend's CPU comes from the ~10 non-avatar requests per session**, ~25 ms of CPU each
     on average. Prime suspect: big payloads. `GET /api/servers` is 270 KB per call (it embeds all
     500 members) and makes up ~70% of all bytes received. To confirm with profiling (Phase 8
     candidate #5).
  5. Memory rose in both runs (+40–50 MB over 10 min). Watch it in the soak test.
  6. **Stress hypothesis:** ~320 ms of Postgres CPU and ~260 ms of backend CPU per session, so
     **Postgres saturates first, at ~190 sessions/min**.

<!--
### <Test> — <testid>

- **Commit:** `git rev-parse --short HEAD`
- **Config:** executor, stages / rate, duration
- **Hypothesis:** what I expect to happen, and why
- **Result:** thresholds passed/failed, p95/p99, error rate, throughput, dropped iterations
- **Server side:** backend CPU / throttling, memory, DB connections, top query from pg_stat_statements
- **Conclusion:** hypothesis confirmed or rejected; what to try next
-->
