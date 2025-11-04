import express from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../../utils/middleware.js";
import { serverInviteController as defaultController } from "./serverInvite.controller.js";

export function createServerInviteRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
} = {}) {
  const router = express.Router();

  router.post("/send", authMiddleware, controller.sendInvite);
  router.post("/accept/:inviteId", authMiddleware, controller.acceptInvite);
  router.post("/reject/:inviteId", authMiddleware, controller.rejectInvite);
  router.get("/pending", authMiddleware, controller.getPendingInvites);

  return router;
}

export default createServerInviteRouter;
