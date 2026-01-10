// src/services/message/message.routes.ts
import { Router, RequestHandler } from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { messageController as defaultController, createMessageController } from "./message.controller.js";

type MessageController = ReturnType<typeof createMessageController>;

interface MessageRouterOptions {
  controller?: MessageController;
  authMiddleware?: RequestHandler;
}

export function createMessageRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
}: MessageRouterOptions = {}): Router {
  const router = Router();

  router.post("/", authMiddleware, controller.sendMessage);
  router.get("/:channelId", authMiddleware, controller.getMessages);

  return router;
}

export default createMessageRouter;
