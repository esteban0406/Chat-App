// The REST journey of one chat user. One iteration = one session (ROADMAP, Phase 2):
// load the app once, then visit a few channels, reading history and sending a message.
import http from 'k6/http';
import { sleep } from 'k6';
import exec from 'k6/execution';
import {
  BASE_URL,
  CHANNEL_VISITS,
  PAGINATION_RATIO,
  SEED_PASSWORD,
  SERVER_NAME,
  THINK_MAX,
  THINK_MIN,
  seedEmail,
} from '../lib/config.js';
import {
  getAvatars,
  getChannelMessages,
  getFriendships,
  getMe,
  getServers,
  postMessage,
} from '../lib/api.js';

// Its own name, so the burst of logins in setup() counts against no SLO.
const SETUP_LOGIN = 'POST /api/auth/login (setup)';

const think = () => sleep(THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN));
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function textChannelIds(servers) {
  const server = servers.find((s) => s.name === SERVER_NAME);
  if (!server) return [];
  return (server.channels || []).filter((c) => c.type === 'TEXT').map((c) => c.id);
}

/**
 * Call from a test's setup(). Logs in lt_user_1 … lt_user_<count> and finds the seeded
 * channels the same way the frontend does: through GET /api/servers.
 * Logging in once here (and not in every iteration) is what real users do: the token lasts
 * 7 days. Login load has its own scenario (scenarios/login.js).
 */
export function setupChatUsers(count) {
  const requests = [];
  for (let n = 1; n <= count; n++) {
    requests.push({
      method: 'POST',
      url: `${BASE_URL}/api/auth/login`,
      body: JSON.stringify({ email: seedEmail(n), password: SEED_PASSWORD }),
      params: {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: SETUP_LOGIN },
      },
    });
  }

  const users = [];
  http.batch(requests).forEach((res, i) => {
    if (res.status !== 201) {
      exec.test.abort(`setup: login of ${seedEmail(i + 1)} failed (${res.status}). Run ./run.sh seed`);
    }
    const { accessToken, user } = res.json();
    users.push({ token: accessToken, id: user.id, updatedAt: user.updatedAt });
  });

  const channelIds = textChannelIds(getServers(users[0].token));
  if (channelIds.length === 0) {
    exec.test.abort(`setup: "${SERVER_NAME}" or its channels not found. Run ./run.sh seed`);
  }
  return { users, channelIds };
}

/** Requests the avatars of authors this session hasn't loaded yet. */
function loadNewAvatars(page, seen) {
  if (!page) return;
  const fresh = [];
  for (const m of page.messages) {
    if (!seen.has(m.authorId)) {
      seen.add(m.authorId);
      fresh.push(m.authorId);
    }
  }
  getAvatars(fresh);
}

export function chatSession(data) {
  // Each VU is one user. More VUs than tokens wrap around and share.
  const me = data.users[(__VU - 1) % data.users.length];
  // The browser doesn't reload an image already on the page, so each author's avatar is
  // requested once per session.
  const seen = new Set();

  // 1. App load: session check, /home (friends), server list with its channels, own avatar.
  getMe(me.token);
  getFriendships(me.token);
  const fromApi = textChannelIds(getServers(me.token));
  const channelIds = fromApi.length > 0 ? fromApi : data.channelIds;
  getAvatars([me.id], me.updatedAt);
  think();

  // 2. Visit channels: read the latest page, sometimes scroll up, then write.
  for (let i = 0; i < CHANNEL_VISITS; i++) {
    const channelId = pick(channelIds);

    const page = getChannelMessages(me.token, channelId);
    loadNewAvatars(page, seen);
    think();

    if (page && page.hasMore && Math.random() < PAGINATION_RATIO) {
      const older = getChannelMessages(me.token, channelId, page.nextCursor);
      loadNewAvatars(older, seen);
      think();
    }

    postMessage(me.token, channelId, `load test · vu ${__VU} · iteration ${__ITER} · visit ${i + 1}`);
    think();
  }
}
