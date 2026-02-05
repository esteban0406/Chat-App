// src/services/server/index.ts
import { Application, RequestHandler, Router } from "express";
import { createServerService, defaultServerService, ServerService } from "./server.service.js";
import { createServerController } from "./server.controller.js";
import { createServerRouter } from "./server.routes.js";

type ServerController = ReturnType<typeof createServerController>;

interface RegisterServerServiceOptions {
  mountPath?: string;
  serverService?: ServerService;
  controller?: ServerController;
  router?: Router;
  authMiddleware?: RequestHandler;
}

interface RegisteredServerService {
  service: ServerService;
  controller: ServerController;
  router: Router;
}

export function registerServerService(
  app: Application,
  {
    mountPath = "/api/servers",
    serverService = defaultServerService,
    controller,
    router,
    authMiddleware,
  }: RegisterServerServiceOptions = {}
): RegisteredServerService {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de servidores"
    );
  }

  const serviceInstance = serverService ?? createServerService();
  const controllerInstance =
    controller ?? createServerController({ serverService: serviceInstance });

  const routerOptions: { controller: ServerController; authMiddleware?: RequestHandler } = {
    controller: controllerInstance,
  };
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
export type { ServerService } from "./server.service.js";
export {
  createServerController,
  serverController as defaultServerController,
} from "./server.controller.js";
export { createServerRouter } from "./server.routes.js";
export { Server } from "./Server.model.js";
export type { IServer, IServerDocument, IServerModel } from "./Server.model.js";

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
