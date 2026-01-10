// src/services/user/user.routes.ts
import { Router, RequestHandler } from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { userController as defaultController, createUserController } from "./user.controller.js";

type UserController = ReturnType<typeof createUserController>;

interface UserRouterOptions {
  controller?: UserController;
  authMiddleware?: RequestHandler;
}

export function createUserRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
}: UserRouterOptions = {}): Router {
  const router = Router();

  router.get("/search", authMiddleware, controller.searchUser);
  router.get("/", authMiddleware, controller.getUsers);
  router.patch("/me", authMiddleware, controller.updateUser);
  router.patch("/me/status", authMiddleware, controller.updateStatus);
  router.get("/:id/avatar", authMiddleware, controller.proxyAvatar);
  router.get("/:id", authMiddleware, controller.getUser);

  return router;
}

export default createUserRouter;
