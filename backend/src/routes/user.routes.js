import express from "express";
import { getUsers, getUser, searchUser } from "../controllers/user.controller.js";

const router = express.Router();

// 🔹 Buscar usuario por username (debe estar antes de /:id)
router.get("/search", searchUser);

// 🔹 Obtener todos los usuarios
router.get("/", getUsers);

// 🔹 Obtener usuario por ID
router.get("/:id", getUser);

export default router;
