import axios from "axios";
import { fromNodeHeaders } from "better-auth/node";
import { createHttpError, validationError } from "../../utils/httpError.js";
import { betterAuthUserApi as defaultUserApi } from "./betterAuthUser.api.js";
import { getBetterAuth } from "../../auth/betterAuth.js";

const DATA_URL_REGEX = /^data:(.+);base64$/i;
const REMOTE_URL_REGEX = /^https?:\/\//i;

const sanitizeUserDocument = (user) => {
  if (!user) return null;
  const plain = typeof user.toObject === "function" ? user.toObject() : { ...user };
  plain.id = plain.id ?? plain._id?.toString();
  delete plain._id;
  delete plain.password;
  delete plain.__v;
  plain.username =
    plain.username ??
    plain.name ??
    plain.email ??
    plain.email?.split?.("@")?.[0] ??
    plain.id;
  plain.provider = plain.provider ?? "better-auth";
  if (!plain.avatar && plain.image) {
    plain.avatar = plain.image;
  } else if (!plain.image && plain.avatar) {
    plain.image = plain.avatar;
  }
  return plain;
};

const parseDataUrl = (dataUrl) => {
  const [metadata, base64Data] = dataUrl.split(",");
  if (!metadata || !metadata.includes(";base64") || !base64Data) {
    throw validationError("Formato de avatar inválido");
  }

  const mimeMatch = metadata.match(DATA_URL_REGEX);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

  const buffer = Buffer.from(base64Data, "base64");
  const sizeInMB = buffer.length / (1024 * 1024);
  if (sizeInMB > 2) {
    throw validationError("El avatar no puede superar los 2MB", { limitMB: 2 });
  }

  if (!mimeType.startsWith("image/")) {
    throw validationError("Solo se permiten archivos de imagen");
  }

  return { buffer, mimeType };
};

export function createUserService({
  userApi = defaultUserApi,
  httpClient = axios,
} = {}) {
  const sanitizeUser = (user) =>
    userApi?.sanitizeUser ? userApi.sanitizeUser(user) : sanitizeUserDocument(user);

  const listUsers = async ({ authContext } = {}) => {
    const users = await userApi.listUsers({ limit: 100, authContext });
    return users.map(sanitizeUser).filter(Boolean);
  };

  const getUserById = async (id, { authContext } = {}) => {
    const user = await userApi.getUserById(id, authContext);
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
    }
    return sanitizeUser(user);
  };

  const searchUsersByUsername = async (username, { authContext } = {}) => {
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

    return users.map(sanitizeUser);
  };

  const updateUsername = async ({ currentUser, username, authContext } = {}) => {
    if (!currentUser) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (!username || typeof username !== "string") {
      throw validationError("Debes proporcionar un username válido");
    }

    const trimmed = username.trim();
    if (!trimmed) {
      throw validationError("Debes proporcionar un username válido");
    }

    const currentName = currentUser.username ?? currentUser.name ?? "";
    if (trimmed === currentName) {
      return sanitizeUser(currentUser);
    }

    const { auth } = await getBetterAuth();
    const headers = authContext?.headers ? fromNodeHeaders(authContext.headers) : undefined;

    const result = await auth.api.updateUser({
      headers,
      body: { username: trimmed },
    });

    const payload = result && typeof result === "object" && "data" in result ? result.data : result;
    const updatedUser =
      payload?.user ??
      payload?.data?.user ??
      payload?.session?.user ??
      payload?.session?.data?.user ??
      payload;

    if (updatedUser) {
      return sanitizeUser(updatedUser);
    }

    const currentId = currentUser._id ?? currentUser.id;
    if (currentId) {
      const refreshedUser = await userApi.getUserById(currentId, authContext);
      if (refreshedUser) {
        return sanitizeUser(refreshedUser);
      }
    }

    return sanitizeUser(currentUser);
  };

  const updateAvatar = async ({ currentUser, avatar, authContext } = {}) => {
    if (!currentUser) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (!avatar || typeof avatar !== "string") {
      throw validationError("Debes proporcionar un avatar");
    }

    const isDataUrl = avatar.startsWith("data:");
    const isRemoteUrl = REMOTE_URL_REGEX.test(avatar);

    if (!isDataUrl && !isRemoteUrl) {
      throw validationError("El avatar debe ser una imagen base64 o una URL válida");
    }

    if (isDataUrl) {
      parseDataUrl(avatar);
    }

    const { auth } = await getBetterAuth();
    const headers = authContext?.headers ? fromNodeHeaders(authContext.headers) : undefined;
    const result = await auth.api.updateUser({
      headers,
      body: { image: avatar, avatar },
    });

    const payload = result && typeof result === "object" && "data" in result ? result.data : result;
    const updatedUser =
      payload?.user ??
      payload?.data?.user ??
      payload?.session?.user ??
      payload?.session?.data?.user ??
      payload;

    if (updatedUser) {
      return sanitizeUser(updatedUser);
    }

    const currentId = currentUser._id ?? currentUser.id;
    if (currentId) {
      const refreshedUser = await userApi.getUserById(currentId, authContext);
      if (refreshedUser) {
        return sanitizeUser(refreshedUser);
      }
    }

    return sanitizeUser(currentUser);
  };

  const getAvatarResource = async (userId, { authContext } = {}) => {
    const user = await userApi.getUserById(userId, authContext);

    if (!user || !user.avatar) {
      throw createHttpError(404, "Avatar no disponible", { code: "AVATAR_NOT_FOUND" });
    }

    const avatarValue = user.avatar;

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

    let avatarUrl;
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
    } catch (error) {
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
    sanitizeUser,
    listUsers,
    getUserById,
    searchUsersByUsername,
    updateUsername,
    updateAvatar,
    getAvatarResource,
  };
}

export const defaultUserService = createUserService();
