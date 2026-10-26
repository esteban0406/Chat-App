// Logins at a low, steady rate. Each one costs ~80 ms of bcrypt CPU on the backend, so this
// scenario measures the most CPU-heavy endpoint separately from the chat journey.
import { SEED_PASSWORD, SEED_USER_COUNT, seedEmail } from '../lib/config.js';
import { login } from '../lib/api.js';

export function loginUser() {
  const n = 1 + Math.floor(Math.random() * SEED_USER_COUNT);
  login(seedEmail(n), SEED_PASSWORD);
}
