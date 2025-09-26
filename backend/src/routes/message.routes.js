import { Router } from "express";
import { messageController } from "../controllers/message.controller.js";

export default function createMessageRoutes(io) {
  const router = Router();
  const { sendMessage, getMessages } = messageController(io);

  router.post("/", sendMessage);
  router.get("/:channelId", getMessages);

  return router;
}
