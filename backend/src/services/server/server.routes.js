import express from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { serverController as defaultController } from "./server.controller.js";

export function createServerRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
} = {}) {
  const router = express.Router();

  router.post("/", authMiddleware, controller.createServer);
  router.get("/", authMiddleware, controller.getServers);
  router.post("/join", controller.joinServer);
  router.delete("/:serverId", authMiddleware, controller.deleteServer);
  router.delete("/:serverId/members/:memberId", authMiddleware, controller.removeMember);
  router.post("/:serverId/leave", authMiddleware, controller.leaveServer);

  return router;
}

export default createServerRouter;
