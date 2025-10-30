import express from "express";
import {
  getUsers,
  getUser,
  searchUser,
  proxyAvatar,
} from "../controllers/user.controller.js";

const router = express.Router();

// 🔹 Buscar usuario por username (debe estar antes de /:id)
router.get("/search", searchUser);

// 🔹 Obtener todos los usuarios
router.get("/", getUsers);

// 🔹 Proxy de avatar (debe ir antes de /:id)
router.get("/:id/avatar", proxyAvatar);

// 🔹 Obtener usuario por ID
router.get("/:id", getUser);

export default router;
