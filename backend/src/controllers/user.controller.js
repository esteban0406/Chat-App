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
    try {
      avatarUrl = new URL(user.avatar);
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
