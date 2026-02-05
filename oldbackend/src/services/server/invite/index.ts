// src/services/server/invite/index.ts
import { Application, RequestHandler, Router } from "express";
import {
  createServerInviteService,
  defaultServerInviteService,
  ServerInviteService,
} from "./serverInvite.service.js";
import { createServerInviteController } from "./serverInvite.controller.js";
import { createServerInviteRouter } from "./serverInvite.routes.js";

type ServerInviteController = ReturnType<typeof createServerInviteController>;

interface RegisterServerInviteServiceOptions {
  mountPath?: string;
  serverInviteService?: ServerInviteService;
  controller?: ServerInviteController;
  router?: Router;
  authMiddleware?: RequestHandler;
}

interface RegisteredServerInviteService {
  service: ServerInviteService;
  controller: ServerInviteController;
  router: Router;
}

export function registerServerInviteService(
  app: Application,
  {
    mountPath = "/api/server-invites",
    serverInviteService = defaultServerInviteService,
    controller,
    router,
    authMiddleware,
  }: RegisterServerInviteServiceOptions = {}
): RegisteredServerInviteService {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de invitaciones"
    );
  }

  const serviceInstance = serverInviteService ?? createServerInviteService();
  const controllerInstance =
    controller ??
    createServerInviteController({ serverInviteService: serviceInstance });

  const routerOptions: { controller: ServerInviteController; authMiddleware?: RequestHandler } = {
    controller: controllerInstance,
  };
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
export type { ServerInviteService, UserSummary, ServerSummary } from "./serverInvite.service.js";
export {
  createServerInviteController,
  serverInviteController as defaultServerInviteController,
  sendServerInvite,
  acceptServerInvite,
  rejectServerInvite,
  getPendingServerInvites,
} from "./serverInvite.controller.js";
export { createServerInviteRouter } from "./serverInvite.routes.js";
export { ServerInviteModel } from "./ServerInvite.model.js";
export type {
  IServerInvite,
  IServerInviteDocument,
  IServerInviteModel,
  ServerInviteStatus,
} from "./ServerInvite.model.js";

export default registerServerInviteService;
