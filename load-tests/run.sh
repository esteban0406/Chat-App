#!/usr/bin/env bash
# Single entry point for the load-test stack and k6 runs.
#
#   ./run.sh up                 build + start backend, Postgres, Prometheus, Grafana
#   ./run.sh seed               wipe the load-test DB and insert the seed dataset
#   ./run.sh <test> [k6 args]   run tests/<test>.js (smoke, load, stress, spike, soak, …)
#   ./run.sh stats              live CPU / memory of backend + Postgres
#   ./run.sh logs               follow backend logs
#   ./run.sh psql               open psql on the load-test DB
#   ./run.sh down               stop the stack (data kept)
#   ./run.sh clean              stop the stack and delete all its data (DB, Prometheus, Grafana)
#
# Every test run gets a unique testid (e.g. load-20261022-213000). It is attached
# to every metric so Grafana can show one run or compare several.
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE=(docker compose -f docker-compose.loadtest.yml)

usage() { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; }

case "${1:-}" in
  up)
    "${COMPOSE[@]}" up -d --build
    echo
    echo "Backend    http://localhost:4001/api/health"
    echo "Grafana    http://localhost:3001"
    echo "Prometheus http://localhost:9090"
    ;;
  down)  "${COMPOSE[@]}" down ;;
  clean) "${COMPOSE[@]}" down -v ;;
  seed)  docker exec lt-postgres psql -U chatapp -d chatapp_loadtest -q -f /seed/seed.sql ;;
  psql)  docker exec -it lt-postgres psql -U chatapp -d chatapp_loadtest ;;
  logs)  docker logs -f --tail 50 lt-backend ;;
  stats) docker stats lt-backend lt-postgres ;;
  "" | -h | --help) usage ;;
  *)
    test="$1"
    shift
    script="tests/${test}.js"
    if [[ ! -f "$script" ]]; then
      echo "No such test: $script" >&2
      exit 1
    fi

    testid="${test}-$(date +%Y%m%d-%H%M%S)"
    mkdir -p results
    echo "testid: $testid   live dashboard: http://localhost:5665   Grafana: http://localhost:3001"

    # Web dashboard: live charts at :5665 during the run, HTML report saved at the end.
    # Summary export: the end-of-test numbers as JSON, for comparing runs later.
    # Prometheus remote write: latency as native histograms → correct per-window percentiles.
    K6_WEB_DASHBOARD=true \
    K6_WEB_DASHBOARD_EXPORT="results/${testid}.html" \
    K6_PROMETHEUS_RW_SERVER_URL="${K6_PROMETHEUS_RW_SERVER_URL:-http://localhost:9090/api/v1/write}" \
    K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true \
    K6_PROMETHEUS_RW_STALE_MARKERS=true \
      k6 run \
        --tag testid="$testid" \
        -e TESTID="$testid" \
        --summary-export "results/${testid}.json" \
        -o experimental-prometheus-rw \
        "$script" "$@"
    ;;
esac
