import {
  createServerInviteService,
  defaultServerInviteService,
} from "./serverInvite.service.js";
import { createServerInviteController } from "./serverInvite.controller.js";
import { createServerInviteRouter } from "./serverInvite.routes.js";

export function registerServerInviteService(
  app,
  {
    mountPath = "/api/server-invites",
    serverInviteService = defaultServerInviteService,
    controller,
    router,
    authMiddleware,
  } = {},
) {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de invitaciones",
    );
  }

  const serviceInstance = serverInviteService ?? createServerInviteService();
  const controllerInstance =
    controller ??
    createServerInviteController({ serverInviteService: serviceInstance });

  const routerOptions = { controller: controllerInstance };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createServerInviteRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export {
  createServerInviteService,
  defaultServerInviteService,
} from "./serverInvite.service.js";
export {
  createServerInviteController,
  serverInviteController as defaultServerInviteController,
  sendServerInvite,
  acceptServerInvite,
  rejectServerInvite,
  getPendingServerInvites,
} from "./serverInvite.controller.js";
export { createServerInviteRouter } from "./serverInvite.routes.js";
export { default as ServerInviteModel } from "./ServerInvite.model.js";

export default registerServerInviteService;
