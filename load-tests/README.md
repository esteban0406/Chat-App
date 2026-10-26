# Load tests — Chat-App backend

Workload tests (smoke, load, stress, spike, soak) for the NestJS backend, written with
[k6](https://grafana.com/docs/k6/latest/) and observed with Grafana. Built as a learning
project: this README explains the *why* behind every choice, not only the commands.

Results and conclusions live in [FINDINGS.md](FINDINGS.md). Progress and next steps are in
[ROADMAP.md](ROADMAP.md).

---

## Quick start

```bash
# 0. Stop the dev stack — it competes for CPU and skews results
docker compose down

# 1. Start the load-test stack and seed the database
pnpm loadtest:up            # = ./load-tests/run.sh up && ./load-tests/run.sh seed

# 2. Run a test (always smoke first)
cd load-tests
./run.sh smoke

# 3. Look at the results
#    live while running: http://localhost:5665  (k6 web dashboard)
#    afterwards:         results/<testid>.html  (same dashboard, saved)
#                        results/<testid>.json  (end-of-test summary, for comparing runs)
#    server side:        http://localhost:3001  (Grafana → "Chat-App · Load test overview")

# 4. Reset the data before the next comparable run
./run.sh seed
```

`./run.sh` with no arguments lists every command.

## The stack

| Service | Port | What it is |
|---|---|---|
| `lt-backend` | 4001 | The **production** image (`node dist/main`) limited to **1 CPU / 1 GB**, like a small VPS |
| `lt-postgres` | 5434 | Postgres 16, own volume, `pg_stat_statements` enabled, limited to 1 CPU / 1 GB |
| `lt-migrate` | – | One-off container that applies Prisma migrations (the prod image has no Prisma CLI) |
| `prometheus` | 9090 | Receives k6 metrics (remote write) and scrapes the two exporters below |
| `grafana` | 3001 | Dashboards, no login. *Chat-App · Load test overview* and *k6 Prometheus (Native Histograms)* |
| `cadvisor` | – | Container CPU, memory and CPU throttling |
| `postgres-exporter` | – | DB connections, transactions and table statistics |

Why not test the dev stack? `nest start --watch` runs the TypeScript compiler and file watcher
alongside the app. Numbers from it describe your dev tooling, not your server.

Why the limits? k6, the backend and Postgres all share one machine. Without a cap the backend
borrows CPU that k6 needs, and you would need a huge load to break it. With 1 CPU the breaking
point is reachable and the result is reproducible.

### Seed data (`seed/seed.sql`)

| What | Amount |
|---|---|
| Users `lt_user_1@test.com` … `lt_user_500@test.com` | 500 (password `password123`) |
| Server "Load Test Server" (owner `lt_user_1`) | 1, with Admin/Member roles |
| Text channels | 5 (general, random, dev, gaming, music) |
| Members | all 500 users |
| Accepted friendships | 10 per user |
| Messages | 200,000 (40k per channel, going back ~30 days) |

`./run.sh seed` wipes and re-creates everything, and resets Postgres statistics, so each run
starts from the same state.

### Rate limiting

The backend throttles **per IP**: 120 requests/min per endpoint, 10/min on login and register.
Every k6 virtual user comes from your one machine, so with the defaults you would only measure
HTTP 429 responses. The load-test stack sets `THROTTLE_LIMIT` and `AUTH_THROTTLE_LIMIT` very high.
The guard still runs on every request, so its cost is included. The defaults everywhere else are
unchanged.

---

## Concepts

### Vocabulary

| Term | Meaning |
|---|---|
| **VU** (virtual user) | A loop that keeps running your script's default function |
| **Iteration** | One run of that function, e.g. one "user journey" |
| **Scenario** | A named traffic pattern. A test can run several at once (e.g. chatters + logins) |
| **Executor** | How a scenario schedules work: by number of VUs, or by arrival rate |
| **Think time** | `sleep()` between steps. Real users read before they click |
| **Check** | An assertion (`status is 200`). It is counted; it never stops the test |
| **Threshold** | A pass/fail rule on a metric (`p(95)<300`). A failed threshold makes k6 exit with code 99 |
| **SLO** | Service level objective: the latency and error targets your thresholds encode |

### Open vs closed model (the most important idea)

- **Closed model** (`constant-vus`, `ramping-vus`): each VU waits for the response before
  starting its next iteration. When the server slows down, the VUs slow down too, so the load
  *drops* exactly when the server struggles. The test hides the problem. This is called
  **coordinated omission**.
- **Open model** (`constant-arrival-rate`, `ramping-arrival-rate`): new iterations start on a
  schedule (e.g. 10/s) whether the server is fast or not. That is how real users arrive.

We use **arrival-rate for HTTP tests**. WebSocket tests use VUs, because one VU is one long-lived
connection and "connections open at the same time" is what matters there.

With arrival-rate, watch **`dropped_iterations`**. It counts iterations k6 wanted to start but
couldn't, because every VU was busy waiting on slow responses. If it is above 0, the load you
configured was **not** actually delivered.

### Little's law: from "users" to numbers

```
concurrency = throughput × time per iteration
```

200 active users who each complete a journey every 20 s is 200 / 20 = **10 iterations/s**. If
one iteration takes ~7 s (requests plus think time), k6 needs about 10 × 7 = **70 VUs** busy
at once. That is how `preAllocatedVUs` is sized. If responses get slower, more VUs are needed for
the same rate, so a rising VU count is itself a symptom.

### Which numbers to read

| Metric | What it tells you |
|---|---|
| `http_req_duration` p95 / p99 | Latency most users get / the slow tail. **Never use the average**: 99 fast requests hide 1 that took 10 s |
| `http_req_waiting` | Time to first byte, i.e. how long the server took to produce the response |
| `http_req_failed` | Share of requests with status ≥ 400 or a network error |
| `http_reqs` | Throughput, in requests/s |
| `iterations`, `dropped_iterations` | Journeys completed vs journeys that could not even start |
| `vus` | How many VUs were busy |

Percentiles cannot be averaged or added. k6 sends latency to Prometheus as **native histograms**,
so Grafana computes a correct p95 for every time window. That is what lets you see latency rise
during a spike and fall afterwards.

### Client side vs server side: RED and USE

k6 tells you **that** something got slow. The server tells you **why**.

- **RED**, for the service (k6 panels): **R**ate, **E**rrors, **D**uration.
- **USE**, for each resource (container and DB panels): **U**tilization (how busy), **S**aturation
  (how much work is waiting), **E**rrors.

A typical diagnosis reads across both: *"p95 rose at 40 it/s (RED); at that point backend CPU was
pinned at 1.0 core with 60% throttling (USE). The bottleneck is CPU in the Node process."*

Also watch **the load generator**. If k6's own CPU hits 100%, it can't send the configured load
and the results describe your laptop, not the server. k6 prints a warning when that happens.

### Process rules

1. **Smoke test first.** 1 VU, 1 minute. If the script is wrong, a big test just produces big
   wrong numbers.
2. **Write a hypothesis before each run**, e.g. "the 10-connection DB pool saturates before CPU".
   Then the run confirms or rejects something, instead of producing graphs you stare at.
3. **Start every comparable run from the same data** (`./run.sh seed`).
4. **Change one thing at a time.** Two changes in one run tell you nothing about either.
5. **Ignore the warm-up.** The first seconds include JIT compilation and connection pools filling.
6. **Keep a record.** Note the testid, git commit, config and conclusion in FINDINGS.md.

---

## The four test types

All of them reuse the same user journey (`scenarios/`). Only the traffic shape changes.

| Test | Question | Shape | Main signals |
|---|---|---|---|
| **Smoke** | Is the script correct? | 1 VU, 1 min | 0 errors, every check passes |
| **Load** | Does it meet the SLOs at *expected* traffic? | Ramp up → hold → ramp down | Thresholds green, `dropped_iterations` ≈ 0, CPU headroom |
| **Stress** | Where does it break, and *how*? | Keep stepping up past normal | The latency "knee", which resource saturates first, failure mode, recovery |
| **Spike** | Does it survive a sudden burst, and recover? | Low → very high in seconds → low | Errors during the spike, time to recover, crashes |
| **Soak** | Does it degrade over *time*? | Moderate load for 1 h+ | Memory trend, latency drift, growing tables, disk |

### Load test: what to watch
- p95 per endpoint in the overview dashboard. `GET /api/servers` loads every member, role and
  channel of every server, so it is expected to be the slowest read.
- Backend CPU should stay below ~70% of its 1 core. That headroom is what absorbs a burst.
- Memory flat. DB connections well below 10.
- This run is your **baseline**. Every later run is compared against it.

### Stress test: what to watch
- **The knee**: the load level where p95 stops being flat and curves upward.
- **What saturates first**:
  - Backend CPU pinned at 1.0 with throttling rising → **CPU-bound**. Node runs your JavaScript
    on one thread, so every endpoint slows down together.
  - "active" DB connections stuck at 10 while backend CPU is *below* 1.0 → requests are
    **queueing for a DB connection** (the app's `pg` pool has 10).
  - Postgres CPU pinned → the **database** is the limit. Look at `pg_stat_statements`.
- **How it fails**: slower and slower responses? 5xx? Timeouts? A crash (uptime panel drops to 0)?
- **Recovery**: when load drops, does latency return to baseline?

### Spike test: what to watch
- Error rate and p95 during the spike itself.
- **Time to recover**: how long after the spike p95 gets back to baseline.
- The app's DB pool has no acquire timeout, so under a burst requests wait in an unbounded queue.
  Expect latency to balloon (some requests may hit k6's 60 s timeout) rather than fast failures.
- Memory spike, and whether the container restarted.

### Soak test: what to watch
- **Memory**: a line that keeps climbing and never comes back down after garbage collection is a
  leak.
- **Latency drift**: every `POST /api/messages` adds a row. If the history query slows down as
  the `Message` table grows, that is a missing index showing up over time.
- DB connections stable; disk not filling (the backend logs every request; Docker log rotation
  is set to 3 × 10 MB).
- The backend has a demo-data cron at 00:00/06:00/12:00/18:00. A blip at those times is that
  job, not your test.

---

## Investigating the database

Open psql with `./run.sh psql`.

**Which queries cost the most?** `pg_stat_statements` records every query since the last
`./run.sh seed`:

```sql
SELECT round(total_exec_time::numeric) AS total_ms,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       left(regexp_replace(query, '\s+', ' ', 'g'), 120) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

`total_ms` is what matters for capacity: a 2 ms query called 50,000 times costs more than a
200 ms query called 10 times.

**How does Postgres run the message-history query?**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "Message"
WHERE "channelId" = (SELECT id FROM "Channel" WHERE name = 'general')
ORDER BY "createdAt" DESC
LIMIT 51;
```

`Seq Scan` + `Sort` means it reads every message in the table to return 51 rows. `Index Scan`
means it jumps straight to them.

---

## Folder layout

```
load-tests/
├── run.sh                       entry point (stack + tests)
├── docker-compose.loadtest.yml  isolated stack: prod backend, Postgres, observability
├── seed/seed.sql                deterministic dataset
├── observability/               Prometheus config, Grafana provisioning + dashboards
├── lib/                         shared k6 code: config, API helpers, thresholds   (Phase 2)
├── scenarios/                   user journeys: what one VU does                   (Phase 2)
├── tests/                       one file per test type: only the traffic shape    (Phase 2+)
├── studio/                      scripts recorded/generated with k6 Studio         (Phase 1)
├── results/                     HTML reports and summaries (gitignored)
└── FINDINGS.md                  what we learned, run by run
```

## k6 Studio

k6 Studio is for **creating and debugging** scripts, not for charting test runs:

- **Recorder**: browse the app through a proxy and capture every HTTP request.
- **Generator**: turn a recording into a script with rules, e.g. *correlation*: take the
  `accessToken` from the login response and inject it into later `Authorization` headers.
- **Validator**: run one iteration of any script (including the hand-written ones in `tests/`)
  and inspect every request and response.

Charts of a full run come from the k6 web dashboard and Grafana.

### Recording a localhost app

The recorder sends the browser's traffic through a proxy, but Chrome **skips the proxy for
`localhost`**. Record the dev stack as-is and you only capture Google's background traffic.

Workaround: make the browser call the backend by its LAN IP, which does go through the proxy.

1. In `frontend/.env`, set `NEXT_PUBLIC_BACKEND_URL=http://<LAN IP>:4000` (`hostname -I`).
2. `docker compose up -d --force-recreate frontend`. `NEXT_PUBLIC_*` values are read at startup.
3. Record with the page still at `http://localhost:3000`. Page loads aren't captured (we don't
   want them anyway), API calls are. CORS needs no change because the page origin is the same.
4. Set the env back to `localhost:4000` afterwards.

### Generator settings, and why

| Setting | What we chose | Why it matters |
|---|---|---|
| **Host allowlist** | Only the backend (`<LAN IP>:4000`). Static assets off. | `*.gvt1.com` and `*.google.com` are the browser's own traffic (updates, Safe Browsing). `localhost:3000` is Next.js serving pages, which isn't backend load. Anything left in becomes load you didn't mean to generate. |
| **Correlation rule** | Extractor: response **body**, JSON path `accessToken`, filtered to `/api/auth/login`. Replacer: the default (every later occurrence of the recorded value). | Without it the script replays the token captured while recording. It looks fine until the token expires (7 days), every VU shares one identity, and the login result is thrown away. The default replacer also covers both spellings the frontend sends (`Authorization` and `authorization`). |
| **Verification rule** | Optional here: the hand-written scripts in Phase 2 have real checks. | "Status equals the recorded value" is brittle. The second `/auth/me` replays a recorded `If-None-Match` ETag and expects 304, so it fails as soon as the user's data changes. A check that accepts a 404 still counts in `http_req_failed`. And a Validator run with **no** checks is green because nothing is asserted, which proves nothing. |

How to tell the correlation worked: in the exported script, the login is followed by
`correlation_vars["correlation_0"] = resp.json().accessToken`, and no header contains a literal
`eyJhbGci…` token.

### What a recording can't contain

- **WebSocket traffic.** The UI sends chat messages over socket.io, so sending a message leaves
  no HTTP request behind. That's why the WebSocket scenario is written by hand (Phase 7).
- **CORS preflights (`OPTIONS`).** The browser sends one before most cross-origin API calls, and
  the recorder doesn't show them (12 recorded requests vs 20 in the Network tab). k6 isn't a
  browser and never sends them either.

### Noise to strip before reusing a generated script

| Noise | Where it comes from |
|---|---|
| `Proxy-Connection`, `Referer` headers | The recording proxy and the browser |
| `If-None-Match` | The browser's cache. Replaying it turns real responses into 304s |
| Every call twice | React Strict Mode in Next.js dev runs each effect twice. Production calls once |
| `options.stages` (20 VUs, 5½ min) | k6 Studio's default. Never run that against the dev stack |
| Hard-coded email and password | Whatever account you logged in with. Read them from `__ENV` |
