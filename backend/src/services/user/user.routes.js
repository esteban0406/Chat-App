import express from "express";
import { authMiddleware as defaultAuthMiddleware } from "../../utils/middleware.js";
import { userController as defaultController } from "./user.controller.js";

export function createUserRouter({
  controller = defaultController,
  authMiddleware = defaultAuthMiddleware,
} = {}) {
  const router = express.Router();

  router.get("/search", controller.searchUser);
  router.get("/", controller.getUsers);
  router.patch("/me", authMiddleware, controller.updateUsername);
  router.patch("/me/avatar", authMiddleware, controller.updateAvatar);
  router.get("/:id/avatar", controller.proxyAvatar);
  router.get("/:id", controller.getUser);

  return router;
}

export default createUserRouter;
