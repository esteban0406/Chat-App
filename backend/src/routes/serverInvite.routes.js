import express from "express";
import {
  sendServerInvite,
  respondServerInvite,
  getPendingServerInvites,
} from "../controllers/serverInvite.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

// Enviar invitación
router.post("/send", authMiddleware, sendServerInvite);

// Aceptar invitación
router.post("/accept/:inviteId", authMiddleware, (req, res) => {
  req.body = { ...(req.body ?? {}), status: "accepted" };
  respondServerInvite(req, res);
});

// Rechazar invitación
router.post("/reject/:inviteId", authMiddleware, (req, res) => {
  req.body = { ...(req.body ?? {}), status: "rejected" };
  respondServerInvite(req, res);
});

// Obtener invitaciones pendientes
router.get("/pending", authMiddleware, getPendingServerInvites);

export default router;
