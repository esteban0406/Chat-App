// src/services/message/message.controller.ts
import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { ok } from "../../utils/response.js";
import { defaultMessageService, MessageService } from "./message.service.js";

interface MessageControllerDeps {
  messageService?: MessageService;
  io?: SocketIOServer;
}

export function createMessageController({
  messageService = defaultMessageService,
  io,
}: MessageControllerDeps = {}) {
  if (!messageService) {
    throw new Error(
      "messageService es requerido para crear el controlador de mensajes"
    );
  }

  const emitMessage = (channelId: string, payload: Record<string, unknown>) => {
    if (!io || typeof io.to !== "function") {
      return;
    }
    io.to(channelId).emit("message", payload);
  };

  const sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { text, senderId, channelId } = req.body;
      const result = await messageService.createMessage({
        text,
        senderId,
        channelId,
        authContext: req.authContext,
      });

      const messageJson = result.message.toJSON();

      emitMessage(channelId, {
        ...messageJson,
        sender: result.sender,
      });

      return ok(res, {
        status: 201,
        message: "Mensaje enviado",
        data: {
          message: {
            ...messageJson,
            sender: result.sender,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const results = await messageService.listMessages({
        channelId: req.params?.channelId,
        authContext: req.authContext,
      });

      const messages = results.map(({ message, sender }) => ({
        ...message.toJSON(),
        sender,
      }));

      return ok(res, {
        data: { messages },
      });
    } catch (error) {
      return next(error);
    }
  };

  return {
    sendMessage,
    getMessages,
  };
}

export const messageController = createMessageController();

export const { sendMessage, getMessages } = messageController;

export default messageController;
