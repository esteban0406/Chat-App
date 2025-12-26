import { fromNodeHeaders } from "better-auth/node";
import { getBetterAuth } from "../../auth/betterAuth.js";

const toPlainObject = (doc) =>
  doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

const sanitizeUserDocument = (user) => {
  if (!user) return null;
  const plain = toPlainObject(user);
  const id = plain.id ?? plain._id?.toString();
  if (!id) return null;
  const sanitized = {
    ...plain,
    id,
  };
  const preferredName =
    plain.name ??
    plain.username ??
    plain.email ??
    plain.email?.split?.("@")?.[0] ??
    id;
  sanitized.username =
    preferredName ??
    sanitized.username;
  sanitized.handle =
    plain.username ??
    plain.name ??
    plain.email ??
    plain.email?.split?.("@")?.[0] ??
    sanitized.username;
  sanitized.name = plain.name ?? sanitized.username;
  sanitized.provider = plain.provider ?? "better-auth";
  if (!sanitized.avatar && plain.image) {
    sanitized.avatar = plain.image;
  } else if (!sanitized.image && plain.avatar) {
    sanitized.image = plain.avatar;
  }
  return sanitized;
};

const unwrapData = (result) =>
  result && typeof result === "object" && "data" in result ? result.data : result;

const resolveHeaders = (authContext) =>
  authContext?.headers ? fromNodeHeaders(authContext.headers) : undefined;

const ensureArray = (value) =>
  Array.isArray(value) ? value : value ? [value] : [];

const isNotFoundError = (error) => {
  if (!error) return false;
  const code = error.code ?? error.status ?? error.statusCode ?? error.statusText;
  if (code && String(code).toUpperCase() === "NOT_FOUND") {
    return true;
  }
  if (code === 404 || code === "404") {
    return true;
  }
  const message =
    error.message ??
    error.code ??
    error.reason ??
    error?.cause?.message ??
    error?.cause?.code;
  if (typeof message === "string" && message.toUpperCase().includes("NOT_FOUND")) {
    return true;
  }
  return isNotFoundError(error.cause);
};

export function createBetterAuthUserApi() {
  const callEndpoint = async (operation, authContext) => {
    const { auth } = await getBetterAuth();
    const headers = resolveHeaders(authContext);
    return operation(auth.api, headers);
  };

  const mapUsers = (payload) => {
    const collection =
      payload?.users ??
      payload?.data?.users ??
      payload?.result ??
      payload ??
      [];
    return ensureArray(collection).map(sanitizeUserDocument).filter(Boolean);
  };

  return {
    sanitizeUser: sanitizeUserDocument,

    async listUsers({ limit = 50, offset = 0, authContext } = {}) {
      const result = await callEndpoint(
        (api, headers) =>
          api.listUsers({
            headers,
            query: {
              limit: String(limit),
              offset: String(offset),
            },
          }),
        authContext,
      );
      return mapUsers(unwrapData(result));
    },

    async searchUsers({ term, limit = 10, authContext } = {}) {
      const query = term?.trim();
      if (!query) {
        return [];
      }
      const requestedLimit = Number(limit) || 10;
      const normalizedLimit = Math.max(requestedLimit, 10);
      const searchTerm = query.toLowerCase();
      const matchesSearchTerm = (value) => {
        const normalized = value?.toString?.().toLowerCase();
        return normalized ? normalized.includes(searchTerm) : false;
      };
      const searchResult = await callEndpoint(
        (api, headers) =>
          api.listUsers({
            headers,
            query: {
              limit: String(normalizedLimit),
              filterField: "username",
              filterOperator: "contains",
              filterValue: query,
            },
          }),
        authContext,
      );
      const filtered = mapUsers(unwrapData(searchResult)).filter((user) =>
        matchesSearchTerm(user.username),
      );
      if (filtered.length) {
        return filtered.slice(0, requestedLimit);
      }

      const fallbackResult = await callEndpoint(
        (api, headers) =>
          api.listUsers({
            headers,
            query: {
              limit: String(normalizedLimit * 2),
            },
          }),
        authContext,
      );
      return mapUsers(unwrapData(fallbackResult))
        .filter((user) => matchesSearchTerm(user.username))
        .slice(0, requestedLimit);
    },

    async getUserById(id, authContext) {
      if (!id) return null;
      try {
        const result = await callEndpoint(
          (api, headers) =>
            api.getUser({
              headers,
              query: { id: String(id) },
            }),
          authContext,
        );
        const payload = unwrapData(result);
        return sanitizeUserDocument(payload?.user ?? payload);
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }
    },

    async getUsersByIds(ids = [], authContext) {
      const uniqueIds = Array.from(
        new Set(
          ensureArray(ids)
            .map((value) => value?.toString?.() ?? value)
            .filter(Boolean),
        ),
      );
      if (!uniqueIds.length) {
        return [];
      }

      const results = await Promise.all(
        uniqueIds.map((userId) =>
          callEndpoint(
            (api, headers) =>
              api.getUser({
                headers,
                query: { id: String(userId) },
              }),
            authContext,
          ).catch(() => null),
        ),
      );

      return results
        .map((entry) => {
          const payload = unwrapData(entry);
          return sanitizeUserDocument(payload?.user ?? payload);
        })
        .filter(Boolean);
    },
  };
}

export const betterAuthUserApi = createBetterAuthUserApi();
