// src/services/server/server.routes.ts
import { Router, RequestHandler } from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { serverController as defaultController, createServerController } from "./server.controller.js";

type ServerController = ReturnType<typeof createServerController>;

interface ServerRouterOptions {
  controller?: ServerController;
  authMiddleware?: RequestHandler;
}

export function createServerRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
}: ServerRouterOptions = {}): Router {
  const router = Router();

  router.post("/", authMiddleware, controller.createServer);
  router.get("/", authMiddleware, controller.getServers);
  router.post("/join", authMiddleware, controller.joinServer);
  router.delete("/:serverId", authMiddleware, controller.deleteServer);
  router.delete("/:serverId/members/:memberId", authMiddleware, controller.removeMember);
  router.post("/:serverId/leave", authMiddleware, controller.leaveServer);

  return router;
}

export default createServerRouter;
