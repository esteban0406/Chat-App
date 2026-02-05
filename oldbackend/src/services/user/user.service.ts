// src/services/user/user.service.ts
import axios, { AxiosInstance } from "axios";
import { fromNodeHeaders } from "better-auth/node";
import { createHttpError, validationError } from "../../utils/httpError.js";
import { betterAuthUserApi, BetterAuthUserApi } from "./betterAuthUser.api.js";
import { getBetterAuth } from "../../auth/betterAuth.js";
import { User } from "./user.model.js";
import type { AuthContext, SanitizedUser } from "../../auth/betterAuth.types.js";

// =======================
// Constants & Regex
// =======================

const DATA_URL_REGEX = /^data:(.+);base64$/i;
const REMOTE_URL_REGEX = /^https?:\/\//i;
const MAX_AVATAR_SIZE_MB = 2;

// =======================
// Types
// =======================

interface UpdateUserParams {
  currentUser: SanitizedUser;
  name?: string;
  username?: string;
  image?: string; // Better Auth calls it "image" not "avatar"
  authContext?: AuthContext;
}

interface UpdateStatusParams {
  currentUser: SanitizedUser;
  status: string;
  authContext?: AuthContext;
}

interface GetAvatarResourceParams {
  authContext?: AuthContext;
}

interface AvatarResource {
  type: "buffer" | "stream";
  body: Buffer | any; // Stream type from axios
  headers: {
    "Content-Type": string;
    "Cache-Control": string;
    "Content-Length"?: number | string;
  };
}

interface ParsedDataUrl {
  buffer: Buffer;
  mimeType: string;
}

interface UserServiceDeps {
  userApi?: BetterAuthUserApi;
  httpClient?: AxiosInstance;
}

// =======================
// Helper Functions
// =======================

function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const [metadata, base64Data] = dataUrl.split(",");
  if (!metadata || !metadata.includes(";base64") || !base64Data) {
    throw validationError("Formato de avatar inválido");
  }

  const mimeMatch = metadata.match(DATA_URL_REGEX);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

  const buffer = Buffer.from(base64Data, "base64");
  const sizeInMB = buffer.length / (1024 * 1024);
  
  if (sizeInMB > MAX_AVATAR_SIZE_MB) {
    throw validationError(
      `El avatar no puede superar los ${MAX_AVATAR_SIZE_MB}MB`,
      { limitMB: MAX_AVATAR_SIZE_MB }
    );
  }

  if (!mimeType.startsWith("image/")) {
    throw validationError("Solo se permiten archivos de imagen");
  }

  return { buffer, mimeType };
}

// =======================
// User Service
// =======================

export interface UserService {
  listUsers(options?: { authContext?: AuthContext }): Promise<SanitizedUser[]>;
  getUserById(id: string, options?: { authContext?: AuthContext }): Promise<SanitizedUser>;
  searchUsersByUsername(username: string, options?: { authContext?: AuthContext }): Promise<SanitizedUser[]>;
  updateUser(params: UpdateUserParams): Promise<SanitizedUser>;
  updateStatus(params: UpdateStatusParams): Promise<SanitizedUser>;
  getAvatarResource(userId: string, options?: GetAvatarResourceParams): Promise<AvatarResource>;
}

export function createUserService(deps: UserServiceDeps = {}): UserService {
  const {
    userApi = betterAuthUserApi,
    httpClient = axios,
  } = deps;

  // =======================
  // List Users
  // =======================
  const listUsers = async ({ authContext }: { authContext?: AuthContext } = {}): Promise<SanitizedUser[]> => {
    const users = await userApi.listUsers({ limit: 100, authContext });
    return users.filter(Boolean);
  };

  // =======================
  // Get User By ID
  // =======================
  const getUserById = async (
    id: string,
    { authContext }: { authContext?: AuthContext } = {}
  ): Promise<SanitizedUser> => {
    const user = await userApi.getUserById(id, authContext);
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
    }
    return user;
  };

  // =======================
  // Search Users by Username
  // =======================
  const searchUsersByUsername = async (
    username: string,
    { authContext }: { authContext?: AuthContext } = {}
  ): Promise<SanitizedUser[]> => {
    if (!username || username.trim() === "") {
      throw validationError("Debes proporcionar un username");
    }

    const users = await userApi.searchUsers({
      term: username,
      limit: 10,
      authContext,
    });

    if (!users.length) {
      throw createHttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
    }

    return users;
  };

  const updateUser = async ({
    currentUser,
    name,
    username,
    image,
    authContext,
  }: UpdateUserParams): Promise<SanitizedUser> => {
    if (!currentUser) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    // Build the update body
    const updateBody: Record<string, any> = {};

    // Update name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw validationError("Debes proporcionar un nombre válido");
      }
      updateBody.name = trimmedName;
    }

    // Update username if provided (requires username plugin)
    if (username !== undefined) {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        throw validationError("Debes proporcionar un username válido");
      }
      updateBody.username = trimmedUsername;
    }

    // Update avatar/image if provided
    if (image !== undefined) {
      if (!image || typeof image !== "string") {
        throw validationError("Debes proporcionar una imagen válida");
      }

      const isDataUrl = image.startsWith("data:");
      const isRemoteUrl = REMOTE_URL_REGEX.test(image);

      if (!isDataUrl && !isRemoteUrl) {
        throw validationError("La imagen debe ser base64 o una URL válida");
      }

      // Validate data URL if provided
      if (isDataUrl) {
        parseDataUrl(image);
      }

      updateBody.image = image; 
    }

    // If nothing to update, return current user
    if (Object.keys(updateBody).length === 0) {
      return currentUser;
    }

    // Call Better Auth's updateUser API
    const { auth } = await getBetterAuth();
    const headers = authContext?.headers ? fromNodeHeaders(authContext.headers) : undefined;

    await auth.api.updateUser({
      headers,
      body: updateBody,
    });

    // Refresh to get merged data with custom fields
    return getUserById(currentUser.id, { authContext });
  };

  const updateStatus = async ({
    currentUser,
    status,
    authContext,
  }: UpdateStatusParams): Promise<SanitizedUser> => {
    if (!currentUser) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (typeof status !== "string") {
      throw validationError("Debes proporcionar un status válido");
    }

    const trimmed = status.trim();
    if (trimmed.length > 128) {
      throw validationError("El status no puede superar los 128 caracteres");
    }

    const customUser = await User.findByAuthUserId(currentUser.id);
    if (!customUser) {
      throw createHttpError(404, "User record not found", { code: "USER_NOT_FOUND" });
    }

    customUser.status = trimmed || undefined;
    await customUser.save();

    return getUserById(currentUser.id, { authContext });
  };

  const getAvatarResource = async (
    userId: string,
    { authContext }: GetAvatarResourceParams = {}
  ): Promise<AvatarResource> => {
    const user = await userApi.getUserById(userId, authContext);

    // Better Auth stores avatars as "image", but our SanitizedUser calls it "avatar"
    if (!user || !user.avatar) {
      throw createHttpError(404, "Avatar no disponible", { code: "AVATAR_NOT_FOUND" });
    }

    const avatarValue = user.avatar;

    // Handle data URL
    if (avatarValue.startsWith("data:")) {
      const { buffer, mimeType } = parseDataUrl(avatarValue);
      return {
        type: "buffer",
        body: buffer,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "no-store",
          "Content-Length": buffer.length,
        },
      };
    }

    if (!REMOTE_URL_REGEX.test(avatarValue)) {
      throw validationError("URL de avatar inválida", { reason: "INVALID_AVATAR_URL" });
    }

    let avatarUrl: URL;
    try {
      avatarUrl = new URL(avatarValue);
    } catch {
      throw validationError("URL de avatar inválida", { reason: "INVALID_AVATAR_URL" });
    }

    try {
      const response = await httpClient.get(avatarUrl.toString(), {
        responseType: "stream",
        timeout: 8000,
        headers: {
          "User-Agent": "ChatAppAvatarProxy/1.0",
        },
      });

      return {
        type: "stream",
        body: response.data,
        headers: {
          "Content-Type": response.headers["content-type"] || "image/jpeg",
          "Cache-Control": response.headers["cache-control"] || "public, max-age=86400",
          ...(response.headers["content-length"]
            ? { "Content-Length": response.headers["content-length"] }
            : {}),
        },
      };
    } catch (error: any) {
      if (error.response) {
        throw createHttpError(error.response.status, "No se pudo obtener el avatar", {
          code: "AVATAR_PROXY_ERROR",
        });
      }

      if (error.code === "ECONNABORTED") {
        throw createHttpError(504, "Timeout obteniendo avatar", {
          code: "AVATAR_PROXY_TIMEOUT",
        });
      }

      throw error;
    }
  };

  return {
    listUsers,
    getUserById,
    searchUsersByUsername,
    updateUser,
    updateStatus,
    getAvatarResource,
  };
}

export const defaultUserService = createUserService();