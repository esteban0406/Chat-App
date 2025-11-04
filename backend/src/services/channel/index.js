import { createChannelService, defaultChannelService } from "./channel.service.js";
import { createChannelController } from "./channel.controller.js";
import { createChannelRouter } from "./channel.routes.js";

export function registerChannelService(
  app,
  {
    mountPath = "/api/channels",
    channelService = defaultChannelService,
    controller,
    router,
    authMiddleware,
  } = {},
) {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de canales",
    );
  }

  const serviceInstance = channelService ?? createChannelService();
  const controllerInstance =
    controller ??
    createChannelController({ channelService: serviceInstance });

  const routerOptions = { controller: controllerInstance };
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
export {
  createChannelController,
  channelController as defaultChannelController,
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
} from "./channel.controller.js";
export { createChannelRouter } from "./channel.routes.js";
export { default as ChannelModel } from "./Channel.model.js";

export default registerChannelService;
