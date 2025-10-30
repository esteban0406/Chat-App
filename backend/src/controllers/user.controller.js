import axios from "axios";
import User from "../models/User.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const searchUser = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "Debes proporcionar un username" });
    }

    const user = await User.findOne({
      username: new RegExp(username, "i"),
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const proxyAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("avatar");

    if (!user || !user.avatar) {
      return res.status(404).json({ error: "Avatar no disponible" });
    }

    let avatarUrl;
    const avatarValue = user.avatar;

    if (avatarValue.startsWith("data:")) {
      const [metadata, base64Data] = avatarValue.split(",");
      if (!metadata || !metadata.includes(";base64") || !base64Data) {
        return res.status(400).json({ error: "Formato de avatar inválido" });
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
        return res.status(400).json({ error: "Datos de avatar corruptos" });
      }
    }

    try {
      avatarUrl = new URL(avatarValue);
    } catch {
      return res.status(400).json({ error: "URL de avatar inválida" });
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
      return res
        .status(error.response.status)
        .json({ error: "No se pudo obtener el avatar" });
    }

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Timeout obteniendo avatar" });
    }

    return next(error);
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Debes proporcionar un username válido" });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      return res
        .status(400)
        .json({ error: "El username debe tener entre 3 y 30 caracteres" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (trimmed === req.user.username) {
      const currentUser = req.user.toObject();
      currentUser.id = currentUser._id;
      return res.json(currentUser);
    }

    const escapedUsername = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Ese username ya está en uso" });
    }

    req.user.username = trimmed;
    await req.user.save();

    const updatedUser = await User.findById(req.user._id).select("-password");
    const sanitized = updatedUser.toObject();
    sanitized.id = sanitized._id;

    return res.json(sanitized);
  } catch (error) {
    return next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (!avatar || typeof avatar !== "string") {
      return res.status(400).json({ error: "Debes proporcionar un avatar" });
    }

    const isDataUrl = avatar.startsWith("data:");
    const isRemoteUrl = /^https?:\/\//i.test(avatar);

    if (!isDataUrl && !isRemoteUrl) {
      return res
        .status(400)
        .json({ error: "El avatar debe ser una imagen base64 o una URL válida" });
    }

    if (isDataUrl) {
      const [metadata, base64Data] = avatar.split(",");
      if (!metadata || !metadata.includes(";base64") || !base64Data) {
        return res.status(400).json({ error: "Formato de imagen inválido" });
      }
      const buffer = Buffer.from(base64Data, "base64");
      const sizeInMB = buffer.length / (1024 * 1024);
      if (sizeInMB > 2) {
        return res
          .status(400)
          .json({ error: "El avatar no puede superar los 2MB" });
      }
      const mimeMatch = metadata.match(/^data:(.+);base64$/i);
      if (!mimeMatch || !mimeMatch[1].startsWith("image/")) {
        return res.status(400).json({ error: "Solo se permiten archivos de imagen" });
      }
    }

    req.user.avatar = avatar;
    await req.user.save();

    const updatedUser = await User.findById(req.user._id).select("-password");
    const sanitized = updatedUser.toObject();
    sanitized.id = sanitized._id;

    return res.json(sanitized);
  } catch (error) {
    return next(error);
  }
};
