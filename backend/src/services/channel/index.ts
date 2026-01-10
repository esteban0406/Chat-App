// src/services/channel/index.ts
import { Application, RequestHandler, Router } from "express";
import { createChannelService, defaultChannelService, ChannelService } from "./channel.service.js";
import { createChannelController } from "./channel.controller.js";
import { createChannelRouter } from "./channel.routes.js";

type ChannelController = ReturnType<typeof createChannelController>;

interface RegisterChannelServiceOptions {
  mountPath?: string;
  channelService?: ChannelService;
  controller?: ChannelController;
  router?: Router;
  authMiddleware?: RequestHandler;
}

interface RegisteredChannelService {
  service: ChannelService;
  controller: ChannelController;
  router: Router;
}

export function registerChannelService(
  app: Application,
  {
    mountPath = "/api/channels",
    channelService = defaultChannelService,
    controller,
    router,
    authMiddleware,
  }: RegisterChannelServiceOptions = {}
): RegisteredChannelService {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de canales"
    );
  }

  const serviceInstance = channelService ?? createChannelService();
  const controllerInstance =
    controller ?? createChannelController({ channelService: serviceInstance });

  const routerOptions: { controller: ChannelController; authMiddleware?: RequestHandler } = {
    controller: controllerInstance,
  };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createChannelRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export { createChannelService, defaultChannelService } from "./channel.service.js";
export type { ChannelService } from "./channel.service.js";
export {
  createChannelController,
  channelController as defaultChannelController,
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
} from "./channel.controller.js";
export { createChannelRouter } from "./channel.routes.js";
export { Channel, Channel as ChannelModel } from "./Channel.model.js";
export type { IChannel, IChannelDocument, IChannelModel, ChannelType } from "./Channel.model.js";

export default registerChannelService;
