import express from "express";
import { sendFriendRequest, respondFriendRequest, getPendingFriendRequests } from "../controllers/friend.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

router.post("/send", authMiddleware, sendFriendRequest);
router.post("/respond", authMiddleware, respondFriendRequest);
router.get("/pending", authMiddleware, getPendingFriendRequests);

export default router;
