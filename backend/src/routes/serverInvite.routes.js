import express from "express";
import {
  sendServerInvite,
  acceptServerInvite,
  rejectServerInvite,
  getPendingServerInvites,
} from "../controllers/serverInvite.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

// Enviar invitación
router.post("/send", authMiddleware, sendServerInvite);

// Aceptar invitación
router.post("/accept/:inviteId", authMiddleware, acceptServerInvite);

// Rechazar invitación
router.post("/reject/:inviteId", authMiddleware, rejectServerInvite);

// Obtener invitaciones pendientes
router.get("/pending", authMiddleware, getPendingServerInvites);

export default router;
