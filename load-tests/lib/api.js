// REST helpers: one function per endpoint the frontend calls.
//
// Every request carries a `name` tag. URLs contain UUIDs, so without it every channel and user
// would become its own metric series. The name groups them, the Grafana panels group by it, and
// lib/thresholds.js sets one latency SLO per name.
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

export const ENDPOINTS = {
  login: 'POST /api/auth/login',
  me: 'GET /api/auth/me',
  friendships: 'GET /api/friendships',
  servers: 'GET /api/servers',
  messages: 'GET /api/messages/channel/:id',
  olderMessages: 'GET /api/messages/channel/:id (older page)',
  avatar: 'GET /api/users/:id/avatar',
  postMessage: 'POST /api/messages',
};

// "No avatar yet" is a normal case the backend answers with 404 (a Phase 8 candidate).
// Marking it as expected keeps it out of http_req_failed.
const AVATAR_EXPECTED = http.expectedStatuses({ min: 200, max: 399 }, 404);

function params(name, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers, tags: { name } };
}

function jsonOrNull(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

/** Returns `{ token, user }`, or null when the login failed. */
export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    params(ENDPOINTS.login, null),
  );
  const body = jsonOrNull(res);
  const ok = check(res, {
    [`${ENDPOINTS.login} → 201`]: (r) => r.status === 201,
    [`${ENDPOINTS.login} has accessToken`]: () => Boolean(body && body.accessToken),
  });
  return ok ? { token: body.accessToken, user: body.user } : null;
}

export function getMe(token) {
  const res = http.get(`${BASE_URL}/api/auth/me`, params(ENDPOINTS.me, token));
  check(res, { [`${ENDPOINTS.me} → 200`]: (r) => r.status === 200 });
}

export function getFriendships(token) {
  const res = http.get(`${BASE_URL}/api/friendships`, params(ENDPOINTS.friendships, token));
  check(res, { [`${ENDPOINTS.friendships} → 200`]: (r) => r.status === 200 });
}

/** Returns the servers array (each with its channels embedded), or [] on failure. */
export function getServers(token) {
  const res = http.get(`${BASE_URL}/api/servers`, params(ENDPOINTS.servers, token));
  const body = jsonOrNull(res);
  check(res, {
    [`${ENDPOINTS.servers} → 200`]: (r) => r.status === 200,
    [`${ENDPOINTS.servers} is a list`]: () => Array.isArray(body),
  });
  return Array.isArray(body) ? body : [];
}

/**
 * Without a cursor: the latest page, called with no query string like the frontend does.
 * With a cursor: the older page, tagged separately so its cost shows on its own.
 * Returns `{ messages, nextCursor, hasMore }`, or null on failure.
 */
export function getChannelMessages(token, channelId, cursor) {
  const name = cursor ? ENDPOINTS.olderMessages : ENDPOINTS.messages;
  const query = cursor ? `?cursor=${cursor}` : '';
  const res = http.get(
    `${BASE_URL}/api/messages/channel/${channelId}${query}`,
    params(name, token),
  );
  const body = jsonOrNull(res);
  const ok = check(res, {
    [`${name} → 200`]: (r) => r.status === 200,
    [`${name} has messages`]: () => Boolean(body && Array.isArray(body.messages)),
  });
  return ok ? body : null;
}

/**
 * Loads avatars in parallel, the way the browser loads the <img> tags of a page.
 * http.batch keeps up to 6 requests in flight per host, like a browser on HTTP/1.1.
 * `query` mimics the cache-buster the profile bar adds to the user's own avatar.
 */
export function getAvatars(userIds, query = '') {
  if (userIds.length === 0) return;
  const suffix = query ? `?${encodeURIComponent(query)}` : '';
  const requests = userIds.map((id) => ({
    method: 'GET',
    url: `${BASE_URL}/api/users/${id}/avatar${suffix}`,
    params: {
      tags: { name: ENDPOINTS.avatar },
      responseCallback: AVATAR_EXPECTED,
      // A user with an avatar gets a redirect to Cloudinary. The browser follows it, but that
      // isn't our backend's load, so k6 must not.
      redirects: 0,
    },
  }));
  for (const res of http.batch(requests)) {
    check(res, {
      [`${ENDPOINTS.avatar} → 404 or redirect`]: (r) =>
        r.status === 404 || (r.status >= 200 && r.status < 400),
    });
  }
}

export function postMessage(token, channelId, content) {
  const res = http.post(
    `${BASE_URL}/api/messages`,
    JSON.stringify({ content, channelId }),
    params(ENDPOINTS.postMessage, token),
  );
  check(res, { [`${ENDPOINTS.postMessage} → 201`]: (r) => r.status === 201 });
}
