import express from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { messageController as defaultController } from "./message.controller.js";

export function createMessageRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
} = {}) {
  const router = express.Router();

  router.post("/", authMiddleware, controller.sendMessage);
  router.get("/:channelId", authMiddleware, controller.getMessages);

  return router;
}

export default createMessageRouter;
