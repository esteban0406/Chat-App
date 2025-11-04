import express from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { channelController as defaultController } from "./channel.controller.js";

export function createChannelRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
} = {}) {
  const router = express.Router();

  router.post("/", authMiddleware, controller.createChannel);
  router.get("/:serverId", authMiddleware, controller.getChannels);
  router.patch("/:channelId", authMiddleware, controller.updateChannel);
  router.delete("/:channelId", authMiddleware, controller.deleteChannel);

  return router;
}

export default createChannelRouter;
