import express from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../../utils/middleware.js";
import { friendRequestController as defaultController } from "./friendRequest.controller.js";

export function createFriendRequestRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
} = {}) {
  const router = express.Router();

  router.post("/send", authMiddleware, controller.sendFriendRequest);
  router.post("/respond/:id", authMiddleware, controller.respondFriendRequest);
  router.get("/pending", authMiddleware, controller.getPendingFriendRequests);
  router.get("/list", authMiddleware, controller.getFriends);

  return router;
}

export default createFriendRequestRouter;
