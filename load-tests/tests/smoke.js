// Smoke test: is the script correct? 1 VU for 1 minute, plus a trickle of logins.
// It must pass with zero errors before any bigger test runs: a big test with a broken script
// only produces big wrong numbers.
//
//   ./run.sh smoke
import { smokeThresholds } from '../lib/thresholds.js';
import { setupChatUsers } from '../scenarios/chat-user.js';

export { chatSession } from '../scenarios/chat-user.js';
export { loginUser } from '../scenarios/login.js';

export const options = {
  scenarios: {
    chat: {
      // Closed model is fine here: we're checking correctness, not delivering a load.
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      exec: 'chatSession',
    },
    login: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '10s',
      duration: '1m',
      preAllocatedVUs: 1,
      exec: 'loginUser',
    },
  },
  // Zero failures, no latency budget (see lib/thresholds.js).
  thresholds: smokeThresholds,
};

export function setup() {
  return setupChatUsers(1);
}
