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
| p95 / p99 latency (all endpoints) | < 300 ms / < 800 ms |
| p95 login (bcrypt) | < 1000 ms |

## Summary

_Filled in as the tests are run._

| Test | testid | Result | Key number |
|---|---|---|---|
| Smoke | | | |
| Load | | | |
| Stress | | | |
| Spike | | | |
| Soak | | | |

---

## Run log

Copy this block for each run.

<!--
### <Test> — <testid>

- **Commit:** `git rev-parse --short HEAD`
- **Config:** executor, stages / rate, duration
- **Hypothesis:** what I expect to happen, and why
- **Result:** thresholds passed/failed, p95/p99, error rate, throughput, dropped iterations
- **Server side:** backend CPU / throttling, memory, DB connections, top query from pg_stat_statements
- **Conclusion:** hypothesis confirmed or rejected; what to try next
-->
