// src/services/user/betterAuthUser.api.ts
import { fromNodeHeaders } from "better-auth/node";
import { getBetterAuth } from "../../auth/betterAuth.js";
import { User, IUserDocument } from "./user.model.js";
import type { User as BetterAuthUser, AuthContext, SanitizedUser } from "../../auth/betterAuth.types.js";

// =======================
// Helper Functions
// =======================

const resolveHeaders = (authContext?: AuthContext) => {
  return authContext?.headers ? fromNodeHeaders(authContext.headers) : undefined;
};

/**
 * Merges Better Auth user data with your custom User model data
 */
async function mergeBetterAuthWithCustomUser(
  betterAuthUser: BetterAuthUser
): Promise<SanitizedUser> {
  let customUser: IUserDocument | null = null;
  try {
    customUser = await User.findByAuthUserId(betterAuthUser.id);
  } catch (error) {
    console.error("Error fetching custom user data:", error);
  }

  return {
    ...betterAuthUser,
    avatar: betterAuthUser.image ?? undefined,
    status: customUser?.status ?? undefined,
    updatedAt: customUser?.updatedAt ?? betterAuthUser.updatedAt,
  };
}

// =======================
// Better Auth User API
// =======================

export interface BetterAuthUserApi {
  listUsers(options?: {
    limit?: number;
    offset?: number;
    authContext?: AuthContext;
  }): Promise<SanitizedUser[]>;

  searchUsers(options: {
    term: string;
    limit?: number;
    authContext?: AuthContext;
  }): Promise<SanitizedUser[]>;

  getUserById(
    id: string,
    authContext?: AuthContext
  ): Promise<SanitizedUser | null>;

  getUsersByIds(
    ids: string[],
    authContext?: AuthContext
  ): Promise<SanitizedUser[]>;
}

export function createBetterAuthUserApi(): BetterAuthUserApi {
  return {
    async listUsers({ limit = 50, offset = 0, authContext } = {}) {
      const { auth } = await getBetterAuth();
      const headers = resolveHeaders(authContext);

      const result = await (auth.api as any).listUsers({
        headers,
        query: {
          limit: String(limit),
          offset: String(offset),
        },
      });

      // Handle both response formats: { users: [...] } or direct array
      const users = result?.users ?? (Array.isArray(result) ? result : []);
      return Promise.all(users.map(mergeBetterAuthWithCustomUser));
    },

    async searchUsers({ term, limit = 10, authContext }) {
      const query = term?.trim();
      if (!query) {
        return [];
      }

      const requestedLimit = Number(limit) || 10;
      const searchTerm = query.toLowerCase();

      const matchesSearchTerm = (value: unknown): boolean => {
        const normalized = String(value ?? "").toLowerCase();
        return normalized.includes(searchTerm);
      };

      const { auth } = await getBetterAuth();
      const headers = resolveHeaders(authContext);

      // Admin plugin API
      const result = await (auth.api as any).listUsers({
        headers,
        query: {
          limit: String(requestedLimit * 2),
        },
      });

      // Handle both response formats: { users: [...] } or direct array
      const usersList = result?.users ?? (Array.isArray(result) ? result : []);
      const allUsers = await Promise.all(
        usersList.map(mergeBetterAuthWithCustomUser)
      );

      return allUsers
        .filter(
          (user) =>
            matchesSearchTerm(user.username) ||
            matchesSearchTerm(user.name) ||
            matchesSearchTerm(user.email)
        )
        .slice(0, requestedLimit);
    },

    async getUserById(id: string, authContext?: AuthContext) {
      if (!id) return null;

      try {
        const { auth } = await getBetterAuth();
        const headers = resolveHeaders(authContext);

        // Admin plugin API - returns user directly or wrapped in { user }
        const result = await (auth.api as any).getUser({
          headers,
          query: { id: String(id) },
        });

        // Handle both response formats: direct user object or { user: ... }
        const user = result?.user ?? result;
        if (!user || !user.id) return null;

        return mergeBetterAuthWithCustomUser(user);
      } catch (error: unknown) {
        // Return null for any error when getting user (invalid ID format, not found, etc.)
        const err = error as { status?: number };
        if (err?.status === 404 || err?.status === 400 || err?.status === 500) return null;
        // Log unexpected errors but still return null to allow service layer to handle it
        console.warn("getUserById error:", error);
        return null;
      }
    },

    async getUsersByIds(ids: string[] = [], authContext?: AuthContext) {
      const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
      if (!uniqueIds.length) {
        return [];
      }

      const { auth } = await getBetterAuth();
      const headers = resolveHeaders(authContext);

      const results = await Promise.all(
        uniqueIds.map((userId) =>
          (auth.api as any)
            .getUser({
              headers,
              query: { id: String(userId) },
            })
            .catch(() => null)
        )
      );

      // Handle both response formats: direct user object or { user: ... }
      const users = results
        .map((result) => result?.user ?? result)
        .filter((user): user is BetterAuthUser => user != null && user.id != null);

      return Promise.all(users.map(mergeBetterAuthWithCustomUser));
    },
  };
}

export const betterAuthUserApi = createBetterAuthUserApi();
