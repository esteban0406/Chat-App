// src/services/message/index.ts
import { Application, RequestHandler, Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { createMessageService, defaultMessageService, MessageService } from "./message.service.js";
import { createMessageController } from "./message.controller.js";
import { createMessageRouter } from "./message.routes.js";

type MessageController = ReturnType<typeof createMessageController>;

interface RegisterMessageServiceOptions {
  mountPath?: string;
  messageService?: MessageService;
  controller?: MessageController;
  router?: Router;
  authMiddleware?: RequestHandler;
  io?: SocketIOServer;
}

interface RegisteredMessageService {
  service: MessageService;
  controller: MessageController;
  router: Router;
}

export function registerMessageService(
  app: Application,
  {
    mountPath = "/api/messages",
    messageService = defaultMessageService,
    controller,
    router,
    authMiddleware,
    io,
  }: RegisterMessageServiceOptions = {}
): RegisteredMessageService {
  if (!app || typeof app.use !== "function") {
    throw new Error(
      "Se requiere una instancia válida de Express para registrar el servicio de mensajes"
    );
  }

  const serviceInstance = messageService ?? createMessageService();
  const controllerInstance =
    controller ?? createMessageController({ messageService: serviceInstance, io });

  const routerOptions: { controller: MessageController; authMiddleware?: RequestHandler } = {
    controller: controllerInstance,
  };
  if (authMiddleware) {
    routerOptions.authMiddleware = authMiddleware;
  }

  const routerInstance = router ?? createMessageRouter(routerOptions);

  app.use(mountPath, routerInstance);

  return {
    service: serviceInstance,
    controller: controllerInstance,
    router: routerInstance,
  };
}

export { createMessageService, defaultMessageService } from "./message.service.js";
export type { MessageService, SenderSummary } from "./message.service.js";
export {
  createMessageController,
  messageController as defaultMessageController,
  sendMessage,
  getMessages,
} from "./message.controller.js";
export { createMessageRouter } from "./message.routes.js";
export { Message, Message as MessageModel } from "./Message.model.js";
export type { IMessage, IMessageDocument, IMessageModel } from "./Message.model.js";

export default registerMessageService;
