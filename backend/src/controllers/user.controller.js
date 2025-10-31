import axios from "axios";
import User from "../models/User.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : { ...user };
  plain.id = plain._id?.toString();
  delete plain._id;
  delete plain.password;
  delete plain.__v;
  return plain;
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return ok(res, {
      data: { users: users.map(sanitizeUser) },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      throw createHttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
    }

    return ok(res, { data: { user: sanitizeUser(user) } });
  } catch (error) {
    return next(error);
  }
};

export const searchUser = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      throw validationError("Debes proporcionar un username");
    }

    const user = await User.findOne({
      username: new RegExp(username, "i"),
    }).select("-password");

    if (!user) {
      throw createHttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
    }

    return ok(res, { data: { user: sanitizeUser(user) } });
  } catch (error) {
    return next(error);
  }
};

export const proxyAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("avatar");

    if (!user || !user.avatar) {
      throw createHttpError(404, "Avatar no disponible", { code: "AVATAR_NOT_FOUND" });
    }

    let avatarUrl;
    const avatarValue = user.avatar;

    if (avatarValue.startsWith("data:")) {
      const [metadata, base64Data] = avatarValue.split(",");
      if (!metadata || !metadata.includes(";base64") || !base64Data) {
        throw validationError("Formato de avatar inválido");
      }

      const mimeMatch = metadata.match(/^data:(.+);base64$/i);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      try {
        const buffer = Buffer.from(base64Data, "base64");
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Length", buffer.length);
        return res.send(buffer);
      } catch {
        throw validationError("Datos de avatar corruptos");
      }
    }

    try {
      avatarUrl = new URL(avatarValue);
    } catch {
      throw validationError("URL de avatar inválida", { reason: "INVALID_AVATAR_URL" });
    }

    const response = await axios.get(avatarUrl.toString(), {
      responseType: "stream",
      timeout: 8000,
      headers: {
        "User-Agent": "ChatAppAvatarProxy/1.0",
      },
    });

    const contentType = response.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", contentType);

    if (response.headers["cache-control"]) {
      res.setHeader("Cache-Control", response.headers["cache-control"]);
    } else {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.on("error", (streamError) => {
      next(streamError);
    });

    return response.data.pipe(res);
  } catch (error) {
    if (error.response) {
      return next(
        createHttpError(error.response.status, "No se pudo obtener el avatar", {
          code: "AVATAR_PROXY_ERROR",
        })
      );
    }

    if (error.code === "ECONNABORTED") {
      return next(
        createHttpError(504, "Timeout obteniendo avatar", { code: "AVATAR_PROXY_TIMEOUT" })
      );
    }

    return next(error);
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== "string") {
      throw validationError("Debes proporcionar un username válido");
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      throw validationError("El username debe tener entre 3 y 30 caracteres");
    }

    if (!req.user) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (trimmed === req.user.username) {
      return ok(res, {
        message: "Username actualizado",
        data: { user: sanitizeUser(req.user) },
      });
    }

    const escapedUsername = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      throw createHttpError(409, "Ese username ya está en uso", { code: "USERNAME_TAKEN" });
    }

    req.user.username = trimmed;
    await req.user.save();

    const updatedUser = await User.findById(req.user._id).select("-password");

    return ok(res, {
      message: "Username actualizado",
      data: { user: sanitizeUser(updatedUser) },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;

    if (!req.user) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    if (!avatar || typeof avatar !== "string") {
      throw validationError("Debes proporcionar un avatar");
    }

    const isDataUrl = avatar.startsWith("data:");
    const isRemoteUrl = /^https?:\/\//i.test(avatar);

    if (!isDataUrl && !isRemoteUrl) {
      throw validationError("El avatar debe ser una imagen base64 o una URL válida");
    }

    if (isDataUrl) {
      const [metadata, base64Data] = avatar.split(",");
      if (!metadata || !metadata.includes(";base64") || !base64Data) {
        throw validationError("Formato de imagen inválido");
      }
      const buffer = Buffer.from(base64Data, "base64");
      const sizeInMB = buffer.length / (1024 * 1024);
      if (sizeInMB > 2) {
        throw validationError("El avatar no puede superar los 2MB", { limitMB: 2 });
      }
      const mimeMatch = metadata.match(/^data:(.+);base64$/i);
      if (!mimeMatch || !mimeMatch[1].startsWith("image/")) {
        throw validationError("Solo se permiten archivos de imagen");
      }
    }

    req.user.avatar = avatar;
    await req.user.save();

    const updatedUser = await User.findById(req.user._id).select("-password");

    return ok(res, {
      message: "Avatar actualizado",
      data: { user: sanitizeUser(updatedUser) },
    });
  } catch (error) {
    return next(error);
  }
};
