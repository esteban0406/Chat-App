import express from "express";
import {
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
} from "../controllers/friend.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

// Enviar solicitud
router.post("/send", authMiddleware, sendFriendRequest);

// Responder solicitud (aceptar o rechazar)
router.post("/respond/:id", authMiddleware, respondFriendRequest);

// Listar solicitudes pendientes
router.get("/pending", authMiddleware, getPendingFriendRequests);

// Listar amigos
router.get("/list", authMiddleware, getFriends);

export default router;
