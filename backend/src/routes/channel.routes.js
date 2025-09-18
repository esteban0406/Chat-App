import express from "express";
import { createChannel, getChannels } from "../controllers/channel.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createChannel);
router.get("/:serverId", authMiddleware, getChannels);

export default router;
