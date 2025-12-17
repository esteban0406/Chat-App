import { runWithEndpointContext } from "@better-auth/core/context";
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

const toHeaders = (headersLike) => {
  if (typeof Headers === "undefined") return undefined;
  if (!headersLike) return new Headers();
  if (headersLike instanceof Headers) return headersLike;
  const converted = new Headers();
  for (const [key, value] of Object.entries(headersLike)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null) converted.append(key, entry);
      });
      continue;
    }
    converted.append(key, value);
  }
  return converted;
};

export function createBetterAuthUserRepository() {
  let contextPromise;

  const getContextWithAdapter = async () => {
    if (!contextPromise) {
      contextPromise = (async () => {
        const { auth } = await getBetterAuth();
        const context = await auth.$context;
        if (!context?.internalAdapter) {
          throw new Error("Better Auth internal adapter is not available");
        }
        return {
          context,
          adapter: context.internalAdapter,
        };
      })();
    }
    return contextPromise;
  };

  const createInternalRunContext = (baseContext, requestContext = {}) => ({
    method: requestContext.method ?? "INTERNAL",
    path: requestContext.path ?? "internal:better-auth-user-repository",
    headers:
      toHeaders(requestContext.headers) ??
      (typeof Headers !== "undefined" ? new Headers() : undefined),
    request: requestContext.request,
    context: {
      ...baseContext,
      returned: undefined,
      responseHeaders: undefined,
      session: requestContext.session ?? baseContext?.session ?? null,
    },
  });

  const runWithAuthContext = async (operation, requestContext) => {
    if (requestContext?.baseContext?.internalAdapter) {
      const baseContext = requestContext.baseContext;
      return runWithEndpointContext(
        createInternalRunContext(baseContext, requestContext),
        () => operation(baseContext.internalAdapter),
      );
    }

    const { adapter, context } = await getContextWithAdapter();
    return runWithEndpointContext(
      createInternalRunContext(context, requestContext),
      () => operation(adapter),
    );
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
    async findById(id, requestContext) {
      if (!id) return null;
      const user = await runWithAuthContext(
        (adapter) => adapter.findUserById(toStringId(id)),
        requestContext,
      );
      return normalizeUser(user);
    },

    async findByIds(ids = [], requestContext) {
      const deduped = uniqueIds(ids);
      if (!deduped.length) return [];
      const results = await runWithAuthContext(
        (adapter) => Promise.all(deduped.map((userId) => adapter.findUserById(userId))),
        requestContext,
      );
      return results.map(normalizeUser).filter(Boolean);
    },

    async listUsers({ limit = 50, offset = 0 } = {}, requestContext) {
      const users = await runWithAuthContext(
        (adapter) => adapter.listUsers?.(limit, offset),
        requestContext,
      );
      return ensureArray(users).map(normalizeUser).filter(Boolean);
    },

    async searchByUsername(username, { limit = 10 } = {}, requestContext) {
      const query = username?.trim();
      if (!query) {
        return [];
      }

      const where = [
        { field: "name", operator: "contains", value: query },
        { field: "email", operator: "contains", value: query, connector: "OR" },
      ];

      let rawResults = [];
      let supportsListUsers = false;
      await runWithAuthContext(
        async (adapter) => {
          supportsListUsers = typeof adapter.listUsers === "function";
          if (!supportsListUsers) {
            rawResults = [];
            return;
          }
          try {
            rawResults = await adapter.listUsers(limit * 5, 0, undefined, where);
          } catch {
            rawResults = await adapter.listUsers(limit * 5, 0);
          }
        },
        requestContext,
      );

      if (!rawResults?.length && supportsListUsers) {
        await runWithAuthContext(
          async (adapter) => {
            if (typeof adapter.listUsers !== "function") {
              rawResults = [];
              return;
            }
            rawResults = await adapter.listUsers(limit * 5, 0);
          },
          requestContext,
        );
      }

      const normalized = ensureArray(rawResults).map(normalizeUser).filter(Boolean);
      const filtered = filterByQuery(normalized, query);
      return filtered.slice(0, limit);
    },

    async isUsernameTaken(username, { excludeId } = {}, requestContext) {
      if (!username) return false;
      const matches = await this.searchByUsername(username, { limit: 20 }, requestContext);
      const normalized = username.trim().toLowerCase();
      return matches.some(
        (user) =>
          user.id !== toStringId(excludeId) &&
          user.username?.toLowerCase() === normalized,
      );
    },

    async updateUser(userId, data, requestContext) {
      if (!userId) {
        throw new Error("userId is required to update a Better Auth user");
      }
      const updated = await runWithAuthContext(
        (adapter) => adapter.updateUser(toStringId(userId), data),
        requestContext,
      );
      return normalizeUser(updated);
    },
  };
}

export const betterAuthUserRepository = createBetterAuthUserRepository();
