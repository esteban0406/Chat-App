import express from "express";
import { sendMessage, getMessages } from "../controllers/message.controller.js";

const router = express.Router();

router.post("/", sendMessage);
router.get("/:channelId", getMessages);

export default router;
