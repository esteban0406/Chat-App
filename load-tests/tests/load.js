// Load test: does the backend meet its SLOs at expected peak traffic? This run is the baseline
// every later run is compared against.
//
// Traffic hypothesis (decided 2026-10-26, ROADMAP Phase 3): a busy evening on the 500-member
// server. 100 users online, each one doing a session (app load + 3 channel visits) about every
// 2 minutes → 50 sessions/min ≈ 115 req/s.
//
//   ./run.sh load
//   ./run.sh load -e SESSIONS_PER_MIN=80      # same shape, different level
import { thresholds } from '../lib/thresholds.js';
import { setupChatUsers } from '../scenarios/chat-user.js';

export { chatSession } from '../scenarios/chat-user.js';
export { loginUser } from '../scenarios/login.js';

const SESSIONS_PER_MIN = Number(__ENV.SESSIONS_PER_MIN ?? 50);
const ONLINE_USERS = 100;

export const options = {
  scenarios: {
    chat: {
      // Open model: sessions start on schedule whether the server is fast or not.
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1m',
      stages: [
        { target: SESSIONS_PER_MIN, duration: '2m' }, // ramp up
        { target: SESSIONS_PER_MIN, duration: '10m' }, // hold: the part to read
        { target: 0, duration: '1m' }, // ramp down
      ],
      // Little's law: 50/min = 0.83/s × ~16 s per session ≈ 14 VUs busy. maxVUs leaves room
      // for slow responses; if k6 needs many more VUs, that is a symptom in itself.
      preAllocatedVUs: 20,
      maxVUs: 100,
      exec: 'chatSession',
    },
    login: {
      // Tokens last 7 days, so logins are rare: ~3/min for 100 online users.
      executor: 'constant-arrival-rate',
      rate: 3,
      timeUnit: '1m',
      duration: '13m',
      preAllocatedVUs: 2,
      maxVUs: 10,
      exec: 'loginUser',
    },
  },
  thresholds,
};

export function setup() {
  // One token per online user.
  return setupChatUsers(ONLINE_USERS);
}
