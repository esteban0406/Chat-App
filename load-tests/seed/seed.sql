-- Load-test seed data. Wipes and re-creates everything, deterministically.
--
-- Run it with:  ./run.sh seed
-- (= docker exec lt-postgres psql -U chatapp -d chatapp_loadtest -f /seed/seed.sql)
--
-- Why a big dataset? An almost-empty table hides missing indexes: Postgres can
-- scan 50 rows instantly. 200k messages make slow query plans show up.
--
-- Why deterministic (no random())? Every reseed produces the same data, so two
-- runs differ only in what you changed — a precondition for comparing results.

\set ON_ERROR_STOP on
SET client_min_messages = warning;

-- Guard: never run this against the dev or test database.
DO $$
BEGIN
  IF current_database() <> 'chatapp_loadtest' THEN
    RAISE EXCEPTION 'seed.sql only runs against chatapp_loadtest (connected to %)', current_database();
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

BEGIN;

TRUNCATE "Message", "Member", "Role", "Channel", "ServerInvite", "Server",
         "Friendship", "Account", "User" CASCADE;

-- ── Users ────────────────────────────────────────────────────────────────────
-- lt_user_1 … lt_user_500, all with password "password123".
-- One precomputed bcrypt hash (cost 10, same as the app's saltRounds) — hashing
-- 500 times here would waste the exact CPU cost we want to measure in the app.
CREATE TEMP TABLE lt_users ON COMMIT DROP AS
SELECT n, gen_random_uuid()::text AS id
FROM generate_series(1, 500) AS n;

INSERT INTO "User" (id, email, username, "passwordHash", status, "createdAt", "updatedAt")
SELECT id,
       format('lt_user_%s@test.com', n),
       format('lt_user_%s', n),
       '$2b$10$baiR41b4ekvSR5eXL6E1WOk3CEY2HgKk9jxL4JwjIYGbqEs/UXVXK',
       'OFFLINE',
       now(), now()
FROM lt_users;

-- ── Friendships ──────────────────────────────────────────────────────────────
-- Each user is friends with the next 10 users (wrapping around). The WebSocket
-- connect/disconnect path notifies every friend, so this gives it real work.
INSERT INTO "Friendship" (id, "senderId", "receiverId", status)
SELECT gen_random_uuid()::text, a.id, b.id, 'ACCEPTED'
FROM lt_users a
CROSS JOIN generate_series(1, 10) AS k
JOIN lt_users b ON b.n = ((a.n - 1 + k) % 500) + 1;

-- ── Server, roles, channels, members ─────────────────────────────────────────
SELECT id AS owner_id FROM lt_users WHERE n = 1 \gset

CREATE TEMP TABLE lt_server ON COMMIT DROP AS
SELECT gen_random_uuid()::text AS id;
SELECT id AS server_id FROM lt_server \gset

INSERT INTO "Server" (id, name, "ownerId", "createdAt", "updatedAt")
VALUES (:'server_id', 'Load Test Server', :'owner_id', now(), now());

CREATE TEMP TABLE lt_roles ON COMMIT DROP AS
SELECT gen_random_uuid()::text AS admin_id, gen_random_uuid()::text AS member_id;
SELECT admin_id, member_id FROM lt_roles \gset

INSERT INTO "Role" (id, name, color, "serverId", permissions) VALUES
  (:'admin_id',  'Admin',  '#ef4444', :'server_id',
   ARRAY['CREATE_CHANNEL','DELETE_CHANNEL','DELETE_SERVER','INVITE_MEMBER',
         'REMOVE_MEMBER','MANAGE_ROLES','RENAME_SERVER']::"ServerPermission"[]),
  (:'member_id', 'Member', '#3b82f6', :'server_id', ARRAY[]::"ServerPermission"[]);

INSERT INTO "Member" (id, "userId", "serverId", "roleId")
SELECT gen_random_uuid()::text, id, :'server_id',
       CASE WHEN n = 1 THEN :'admin_id' ELSE :'member_id' END
FROM lt_users;

CREATE TEMP TABLE lt_channels ON COMMIT DROP AS
SELECT n, gen_random_uuid()::text AS id, name
FROM unnest(ARRAY['general','random','dev','gaming','music']) WITH ORDINALITY AS t(name, n);

INSERT INTO "Channel" (id, name, type, "serverId")
SELECT id, name, 'TEXT', :'server_id' FROM lt_channels;

-- ── Message history ──────────────────────────────────────────────────────────
-- 200,000 messages: 40k per channel, one every 13 s going back ~30 days,
-- authors spread across all users.
INSERT INTO "Message" (id, content, "authorId", "channelId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       format('Seed message #%s — the quick brown fox jumps over the lazy dog', g),
       u.id,
       c.id,
       now() - g * interval '13 seconds',
       now() - g * interval '13 seconds'
FROM generate_series(1, 200000) AS g
JOIN lt_channels c ON c.n = (g % 5) + 1
JOIN lt_users    u ON u.n = ((g * 7919) % 500) + 1;

COMMIT;

-- Fresh planner statistics, and zeroed query/table counters so each run's
-- pg_stat_statements and Grafana DB panels only show that run.
ANALYZE;
SELECT pg_stat_statements_reset() \g /dev/null
SELECT pg_stat_reset() \g /dev/null

SELECT (SELECT count(*) FROM "User")       AS users,
       (SELECT count(*) FROM "Friendship") AS friendships,
       (SELECT count(*) FROM "Channel")    AS channels,
       (SELECT count(*) FROM "Member")     AS members,
       (SELECT count(*) FROM "Message")    AS messages;
