// src/services/channel/channel.routes.ts
import { Router, RequestHandler } from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { channelController as defaultController, createChannelController } from "./channel.controller.js";

type ChannelController = ReturnType<typeof createChannelController>;

interface ChannelRouterOptions {
  controller?: ChannelController;
  authMiddleware?: RequestHandler;
}

export function createChannelRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
}: ChannelRouterOptions = {}): Router {
  const router = Router();

  router.post("/", authMiddleware, controller.createChannel);
  router.get("/:serverId", authMiddleware, controller.getChannels);
  router.patch("/:channelId", authMiddleware, controller.updateChannel);
  router.delete("/:channelId", authMiddleware, controller.deleteChannel);

  return router;
}

export default createChannelRouter;
