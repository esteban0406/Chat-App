// src/services/user/friendRequest/index.ts
import { Application, RequestHandler, Router } from "express";
import {
  createFriendRequestService,
  defaultFriendRequestService,
  FriendRequestService,
} from "./friendRequest.service.js";
import { createFriendRequestController } from "./friendRequest.controller.js";
import { createFriendRequestRouter } from "./friendRequest.routes.js";

type FriendRequestController = ReturnType<typeof createFriendRequestController>;

interface RegisterFriendRequestServiceOptions {
  mountPath?: string;
  friendRequestService?: FriendRequestService;
  controller?: FriendRequestController;
  router?: Router;
  authMiddleware?: RequestHandler;
}

interface RegisteredFriendRequestService {
  service: FriendRequestService;
  controller: FriendRequestController;
  router: Router;
}

export function registerFriendRequestService(
  app: Application,
  {
    mountPath = "/api/friends",
    friendRequestService = defaultFriendRequestService,
    controller,
    router,
    authMiddleware,
  }: RegisterFriendRequestServiceOptions = {}
): RegisteredFriendRequestService {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de solicitudes de amistad"
    );
  }

  const serviceInstance = friendRequestService ?? createFriendRequestService();
  const controllerInstance =
    controller ??
    createFriendRequestController({
      friendRequestService: serviceInstance,
    });

  const routerOptions: { controller: FriendRequestController; authMiddleware?: RequestHandler } = {
    controller: controllerInstance,
  };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createFriendRequestRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export {
  createFriendRequestService,
  defaultFriendRequestService,
} from "./friendRequest.service.js";
export type { FriendRequestService, UserSummary } from "./friendRequest.service.js";
export {
  createFriendRequestController,
  friendRequestController as defaultFriendRequestController,
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
} from "./friendRequest.controller.js";
export { createFriendRequestRouter } from "./friendRequest.routes.js";
export { FriendRequestModel } from "./FriendRequest.model.js";
export type {
  IFriendRequest,
  IFriendRequestDocument,
  IFriendRequestModel,
  FriendRequestStatus,
} from "./FriendRequest.model.js";

export default registerFriendRequestService;
