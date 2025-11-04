import { createMessageService, defaultMessageService } from "./message.service.js";
import { createMessageController } from "./message.controller.js";
import { createMessageRouter } from "./message.routes.js";

export function registerMessageService(
  app,
  {
    mountPath = "/api/messages",
    messageService = defaultMessageService,
    controller,
    router,
    io,
  } = {},
) {
  if (!app || typeof app.use !== "function") {
    throw new Error("Se requiere una instancia válida de Express para registrar el servicio de mensajes");
  }

  const serviceInstance = messageService ?? createMessageService();
  const controllerInstance =
    controller ?? createMessageController({ messageService: serviceInstance, io });

  const routerInstance = router ?? createMessageRouter({ controller: controllerInstance });

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export { createMessageService, defaultMessageService } from "./message.service.js";
export {
  createMessageController,
  messageController as defaultMessageController,
  sendMessage,
  getMessages,
} from "./message.controller.js";
export { createMessageRouter } from "./message.routes.js";
export { default as MessageModel } from "./Message.model.js";

export default registerMessageService;
