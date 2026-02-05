// src/services/user/friendRequest/friendRequest.routes.ts
import { Router, RequestHandler } from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../../utils/middleware.js";
import { friendRequestController as defaultController, createFriendRequestController } from "./friendRequest.controller.js";

type FriendRequestController = ReturnType<typeof createFriendRequestController>;

interface FriendRequestRouterOptions {
  controller?: FriendRequestController;
  authMiddleware?: RequestHandler;
}

export function createFriendRequestRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
}: FriendRequestRouterOptions = {}): Router {
  const router = Router();

  router.post("/send", authMiddleware, controller.sendFriendRequest);
  router.post("/respond/:id", authMiddleware, controller.respondFriendRequest);
  router.get("/pending", authMiddleware, controller.getPendingFriendRequests);
  router.get("/list", authMiddleware, controller.getFriends);

  return router;
}

export default createFriendRequestRouter;
