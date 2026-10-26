// Where the tests point, and the knobs every scenario shares.
// Override any of them per run: ./run.sh smoke -e PAGINATION_RATIO=0

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4001';
// Used by the WebSocket scenario (Phase 7).
export const WS_URL = __ENV.WS_URL || BASE_URL.replace(/^http/, 'ws');

// Seed data (seed/seed.sql): lt_user_1 … lt_user_500, all members of one server.
export const SEED_USER_COUNT = 500;
export const SEED_PASSWORD = 'password123';
export const SERVER_NAME = 'Load Test Server';
export const seedEmail = (n) => `lt_user_${n}@test.com`;

// Journey shape (ROADMAP, Phase 2).
// How many channels one session visits after the app has loaded.
export const CHANNEL_VISITS = Number(__ENV.CHANNEL_VISITS ?? 3);
// Share of channel visits that also load the older page. The frontend can't paginate yet,
// so this models planned behavior; set it to 0 to test the app exactly as it is today.
export const PAGINATION_RATIO = Number(__ENV.PAGINATION_RATIO ?? 0.3);
// Think time between steps, in seconds: real users read before they click.
export const THINK_MIN = 1;
export const THINK_MAX = 3;
