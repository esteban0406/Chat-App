// src/services/server/invite/serverInvite.routes.ts
import { Router, RequestHandler } from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../../utils/middleware.js";
import { serverInviteController as defaultController, createServerInviteController } from "./serverInvite.controller.js";

type ServerInviteController = ReturnType<typeof createServerInviteController>;

interface ServerInviteRouterOptions {
  controller?: ServerInviteController;
  authMiddleware?: RequestHandler;
}

export function createServerInviteRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
}: ServerInviteRouterOptions = {}): Router {
  const router = Router();

  router.post("/send", authMiddleware, controller.sendInvite);
  router.post("/accept/:inviteId", authMiddleware, controller.acceptInvite);
  router.post("/reject/:inviteId", authMiddleware, controller.rejectInvite);
  router.get("/pending", authMiddleware, controller.getPendingInvites);

  return router;
}

export default createServerInviteRouter;
