import { getBetterAuth } from "../../auth/betterAuth.js";

const toStringId = (value) => value?.toString?.() ?? String(value);

const normalizeUser = (user) => {
  if (!user) return null;
  const id = toStringId(user.id ?? user._id);
  const username =
    user.username ??
    user.name ??
    user.email ??
    user.email?.split?.("@")?.[0] ??
    id;

  const avatar = user.avatar ?? user.image ?? null;

  return {
    ...user,
    id,
    username,
    name: user.name ?? username,
    email: user.email ?? null,
    provider: user.provider ?? "better-auth",
    avatar,
    image: user.image ?? avatar,
  };
};

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export function createBetterAuthUserRepository() {
  let adapterPromise;

  const getAdapter = async () => {
    if (!adapterPromise) {
      adapterPromise = (async () => {
        const { auth } = await getBetterAuth();
        const context = await auth.$context;
        if (!context?.internalAdapter) {
          throw new Error("Better Auth internal adapter is not available");
        }
        return context.internalAdapter;
      })();
    }
    return adapterPromise;
  };

  const filterByQuery = (users, query) => {
    if (!query) return users;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => {
      const targets = ensureArray([
        user.username,
        user.name,
        user.email,
      ]).map((value) => value?.toString?.().toLowerCase?.());
      return targets.some((value) => value?.includes?.(normalized));
    });
  };

  const uniqueIds = (ids) =>
    Array.from(new Set(ensureArray(ids).map((id) => toStringId(id)))).filter(Boolean);

  return {
    async findById(id) {
      if (!id) return null;
      const adapter = await getAdapter();
      const user = await adapter.findUserById(toStringId(id));
      return normalizeUser(user);
    },

    async findByIds(ids = []) {
      const adapter = await getAdapter();
      const deduped = uniqueIds(ids);
      if (!deduped.length) return [];
      const results = await Promise.all(
        deduped.map((userId) => adapter.findUserById(userId)),
      );
      return results.map(normalizeUser).filter(Boolean);
    },

    async listUsers({ limit = 50, offset = 0 } = {}) {
      const adapter = await getAdapter();
      const users = await adapter.listUsers?.(limit, offset);
      return ensureArray(users).map(normalizeUser).filter(Boolean);
    },

    async searchByUsername(username, { limit = 10 } = {}) {
      const adapter = await getAdapter();
      const query = username?.trim();
      if (!query) {
        return [];
      }

      const where = [
        { field: "name", operator: "contains", value: query },
        { field: "email", operator: "contains", value: query, connector: "OR" },
      ];

      let rawResults = [];
      if (typeof adapter.listUsers === "function") {
        try {
          rawResults = await adapter.listUsers(limit * 5, 0, undefined, where);
        } catch {
          rawResults = await adapter.listUsers(limit * 5, 0);
        }
      }

      if (!rawResults?.length && typeof adapter.listUsers === "function") {
        rawResults = await adapter.listUsers(limit * 5, 0);
      }

      const normalized = ensureArray(rawResults).map(normalizeUser).filter(Boolean);
      const filtered = filterByQuery(normalized, query);
      return filtered.slice(0, limit);
    },

    async isUsernameTaken(username, { excludeId } = {}) {
      if (!username) return false;
      const matches = await this.searchByUsername(username, { limit: 20 });
      const normalized = username.trim().toLowerCase();
      return matches.some(
        (user) =>
          user.id !== toStringId(excludeId) &&
          user.username?.toLowerCase() === normalized,
      );
    },

    async updateUser(userId, data) {
      if (!userId) {
        throw new Error("userId is required to update a Better Auth user");
      }
      const adapter = await getAdapter();
      const updated = await adapter.updateUser(toStringId(userId), data);
      return normalizeUser(updated);
    },
  };
}

export const betterAuthUserRepository = createBetterAuthUserRepository();
