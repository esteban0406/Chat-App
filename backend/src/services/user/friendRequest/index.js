import {
  createFriendRequestService,
  defaultFriendRequestService,
} from "./friendRequest.service.js";
import { createFriendRequestController } from "./friendRequest.controller.js";
import { createFriendRequestRouter } from "./friendRequest.routes.js";

export function registerFriendRequestService(
  app,
  {
    mountPath = "/api/friends",
    friendRequestService = defaultFriendRequestService,
    controller,
    router,
    authMiddleware,
  } = {},
) {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de solicitudes de amistad",
    );
  }

  const serviceInstance =
    friendRequestService ?? createFriendRequestService();
  const controllerInstance =
    controller ??
    createFriendRequestController({
      friendRequestService: serviceInstance,
    });

  const routerOptions = { controller: controllerInstance };
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
export {
  createFriendRequestController,
  friendRequestController as defaultFriendRequestController,
  sendFriendRequest,
  respondFriendRequest,
  getPendingFriendRequests,
  getFriends,
} from "./friendRequest.controller.js";
export { createFriendRequestRouter } from "./friendRequest.routes.js";
export { default as FriendRequestModel } from "./FriendRequest.model.js";

export default registerFriendRequestService;
