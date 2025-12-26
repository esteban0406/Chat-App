import { ok } from "../../utils/response.js";
import { defaultMessageService } from "./message.service.js";

export function createMessageController({
  messageService = defaultMessageService,
  io,
} = {}) {
  if (!messageService) {
    throw new Error("messageService es requerido para crear el controlador de mensajes");
  }

  const emitMessage = (channelId, payload) => {
    if (!io || typeof io.to !== "function") {
      return;
    }
    io.to(channelId).emit("message", payload);
  };

  const sendMessage = async (req, res, next) => {
    try {
      const { text, senderId, channelId } = req.body;
      const message = await messageService.createMessage({
        text,
        senderId,
        channelId,
        authContext: req.authContext,
      });

      emitMessage(channelId, {
        id: message.id,
        text: message.text,
        sender: message.sender,
        channel: message.channel,
        createdAt: message.createdAt,
      });

      return ok(res, {
        status: 201,
        message: "Mensaje enviado",
        data: { message },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getMessages = async (req, res, next) => {
    try {
      const messages = await messageService.listMessages({
        channelId: req.params?.channelId,
        authContext: req.authContext,
      });

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
