import express from "express";
import { createChannel, getChannels, deleteChannel, updateChannel } from "../controllers/channel.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createChannel);
router.get("/:serverId", authMiddleware, getChannels);
router.patch("/:channelId", authMiddleware, updateChannel);
router.delete("/:channelId", authMiddleware, deleteChannel);


export default router;
