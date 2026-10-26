// The starting SLOs (FINDINGS.md, "Starting SLOs"), checked per endpoint. An aggregate
// percentile lets a slow endpoint hide behind many fast ones: in the first smoke run the older
// page had p95 = 250 ms while the aggregate said 14 ms, because ~90% of requests are avatars.
import { ENDPOINTS } from './api.js';

const latency = {};
for (const name of Object.values(ENDPOINTS)) {
  // Login is bcrypt-bound on purpose, so it gets its own budget.
  latency[`http_req_duration{name:${name}}`] =
    name === ENDPOINTS.login ? ['p(95)<1000'] : ['p(95)<300', 'p(99)<800'];
}

// How long one chat session takes, without the login scenario's short iterations mixed in.
// Little's law needs it to size the arrival rate and preAllocatedVUs. Printed, never fails.
const sessionDuration = { 'iteration_duration{scenario:chat}': [] };

/** For load, stress, spike and soak. */
export const thresholds = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  ...latency,
  ...sessionDuration,
};

/**
 * Smoke checks correctness only: zero failed requests and checks. The per-endpoint latency
 * lines are still printed (an empty threshold never fails but makes k6 show the sub-metric),
 * so a known slow endpoint can't make a correct script look broken.
 */
export const smokeThresholds = {
  http_req_failed: ['rate==0'],
  checks: ['rate==1'],
  ...Object.fromEntries(Object.keys(latency).map((metric) => [metric, []])),
  ...sessionDuration,
};
