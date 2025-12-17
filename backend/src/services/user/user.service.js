import axios from "axios";
import { createHttpError, validationError } from "../../utils/httpError.js";
import {
  betterAuthUserRepository as defaultUserRepository,
  createBetterAuthUserRepository,
} from "./betterAuthUser.repository.js";

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
  userRepository = defaultUserRepository ?? createBetterAuthUserRepository(),
  httpClient = axios,
} = {}) {
  const sanitizeUser = (user) => sanitizeUserDocument(user);

  const listUsers = async () => {
    const users = await userRepository.listUsers({ limit: 100 });
    return users.map(sanitizeUser).filter(Boolean);
  };

  const getUserById = async (id) => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw createHttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
    }
    return sanitizeUser(user);
  };

  const searchUsersByUsername = async (username) => {
    if (!username || username.trim() === "") {
      throw validationError("Debes proporcionar un username");
    }

    const users = await userRepository.searchByUsername(username, { limit: 10 });

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
    if (trimmed.length < 3 || trimmed.length > 30) {
      throw validationError("El username debe tener entre 3 y 30 caracteres");
    }

    const currentName = currentUser.username ?? currentUser.name ?? "";
    if (trimmed === currentName) {
      return sanitizeUser(currentUser);
    }

    const currentId = currentUser._id ?? currentUser.id;

    const usernameTaken = await userRepository.isUsernameTaken(
      trimmed,
      {
        excludeId: currentId,
      },
      authContext,
    );

    if (usernameTaken) {
      throw createHttpError(409, "Ese username ya está en uso", { code: "USERNAME_TAKEN" });
    }

    await userRepository.updateUser(currentId, { name: trimmed }, authContext);
    const updatedUser = await userRepository.findById(currentId, authContext);
    return sanitizeUser(updatedUser);
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

    const currentId = currentUser._id ?? currentUser.id;
    await userRepository.updateUser(currentId, { image: avatar, avatar }, authContext);
    const updatedUser = await userRepository.findById(currentId, authContext);
    return sanitizeUser(updatedUser);
  };

  const getAvatarResource = async (userId) => {
    const user = await userRepository.findById(userId);

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
