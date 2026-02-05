// src/services/user/index.ts
import { Application, RequestHandler, Router } from "express";
import { createUserService, defaultUserService, UserService } from "./user.service.js";
import { createUserController } from "./user.controller.js";
import { createUserRouter } from "./user.routes.js";

type UserController = ReturnType<typeof createUserController>;

interface RegisterUserServiceOptions {
  mountPath?: string;
  userService?: UserService;
  controller?: UserController;
  router?: Router;
  authMiddleware?: RequestHandler;
}

interface RegisteredUserService {
  service: UserService;
  controller: UserController;
  router: Router;
}

export function registerUserService(
  app: Application,
  {
    mountPath = "/api/users",
    userService = defaultUserService,
    controller,
    router,
    authMiddleware,
  }: RegisterUserServiceOptions = {}
): RegisteredUserService {
  if (!app || typeof app.use !== "function") {
    throw new Error("Se requiere una instancia válida de Express para registrar el servicio de usuarios");
  }

  const serviceInstance = userService ?? createUserService();
  const controllerInstance =
    controller ?? createUserController({ userService: serviceInstance });

  const routerOptions: { controller: UserController; authMiddleware?: RequestHandler } = {
    controller: controllerInstance,
  };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createUserRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export { createUserService, defaultUserService } from "./user.service.js";
export type { UserService } from "./user.service.js";
export {
  createUserController,
  userController as defaultUserController,
} from "./user.controller.js";
export { createUserRouter } from "./user.routes.js";

export {
  registerFriendRequestService,
  createFriendRequestService,
  defaultFriendRequestService,
  createFriendRequestController,
  defaultFriendRequestController,
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
  createFriendRequestRouter,
  FriendRequestModel,
} from "./friendRequest/index.js";

export default registerUserService;
