import { createServerService, defaultServerService } from "./server.service.js";
import { createServerController } from "./server.controller.js";
import { createServerRouter } from "./server.routes.js";

export function registerServerService(
  app,
  {
    mountPath = "/api/servers",
    serverService = defaultServerService,
    controller,
    router,
    authMiddleware,
  } = {}
) {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de servidores"
    );
  }

  const serviceInstance = serverService ?? createServerService();
  const controllerInstance =
    controller ?? createServerController({ serverService: serviceInstance });

  const routerOptions = { controller: controllerInstance };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createServerRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export { createServerService, defaultServerService } from "./server.service.js";
export {
  createServerController,
  serverController as defaultServerController,
} from "./server.controller.js";
export { createServerRouter } from "./server.routes.js";

export {
  registerServerInviteService,
  createServerInviteService,
  defaultServerInviteService,
  createServerInviteController,
  defaultServerInviteController,
  sendServerInvite,
  acceptServerInvite,
  rejectServerInvite,
  getPendingServerInvites,
  createServerInviteRouter,
  ServerInviteModel,
} from "./invite/index.js";

export default registerServerService;
