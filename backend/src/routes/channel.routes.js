import express from "express";
import { createChannel, getChannels } from "../controllers/channel.controller.js";

const router = express.Router();

router.post("/", createChannel);
router.get("/:serverId", getChannels);

export default router;
