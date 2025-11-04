import express from "express";
import { messageController as defaultController } from "./message.controller.js";

export function createMessageRouter({ controller = defaultController } = {}) {
  const router = express.Router();

  router.post("/", controller.sendMessage);
  router.get("/:channelId", controller.getMessages);

  return router;
}

export default createMessageRouter;
