import express from "express";
import { sendServerInvite, respondServerInvite, getPendingServerInvites } from "../controllers/serverInvite.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

// Enviar invitación a servidor
router.post("/send", authMiddleware, sendServerInvite);

// Aceptar invitación
router.post("/accept/:inviteId", authMiddleware, respondServerInvite);

// Rechazar invitación
router.post("/reject/:inviteId", authMiddleware, respondServerInvite);

// Obtener invitaciones pendientes
router.get("/pending", authMiddleware, getPendingServerInvites);


export default router;
