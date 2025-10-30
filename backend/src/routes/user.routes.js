import express from "express";
import {
  getUsers,
  getUser,
  searchUser,
  proxyAvatar,
  updateUsername,
  updateAvatar,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

// 🔹 Buscar usuario por username (debe estar antes de /:id)
router.get("/search", searchUser);

// 🔹 Obtener todos los usuarios
router.get("/", getUsers);

// 🔹 Actualizar username del usuario autenticado
router.patch("/me", authMiddleware, updateUsername);

// 🔹 Actualizar avatar del usuario autenticado
router.patch("/me/avatar", authMiddleware, updateAvatar);

// 🔹 Proxy de avatar (debe ir antes de /:id)
router.get("/:id/avatar", proxyAvatar);

// 🔹 Obtener usuario por ID
router.get("/:id", getUser);

export default router;
