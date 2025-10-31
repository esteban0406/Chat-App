import Channel from "../models/Channel.js";
import Message from "../models/Message.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const serializeMessage = (message) => {
  const plain = message.toObject();
  plain.id = plain._id.toString();
  if (plain.channel) {
    plain.channel = plain.channel.toString();
  }
  if (plain.sender && typeof plain.sender === "object" && plain.sender._id) {
    plain.sender = {
      id: plain.sender._id.toString(),
      username: plain.sender.username,
    };
  }
  delete plain._id;
  delete plain.__v;
  return plain;
};

// factory function that receives io
export function messageController(io) {
  return {
    sendMessage: async (req, res, next) => {
      try {
        const { text, senderId, channelId } = req.body;

        if (!text || !senderId || !channelId) {
          throw validationError("Faltan campos obligatorios");
        }

        const message = new Message({ text, sender: senderId, channel: channelId });
        await message.save();

        // Asociar al canal
        const channel = await Channel.findById(channelId);
        if (!channel) {
          throw createHttpError(404, "Canal no encontrado", { code: "CHANNEL_NOT_FOUND" });
        }

        channel.messages.push(message._id);
        await channel.save();

        // Popular autor
        await message.populate("sender", "username");

        // Emitir solo al canal correspondiente
        io.to(channelId).emit("message", {
          _id: message._id,
          text: message.text,
          sender: message.sender,
          channel: channelId,
          createdAt: message.createdAt,
        });

        return ok(res, {
          status: 201,
          message: "Mensaje enviado",
          data: { message: serializeMessage(message) },
        });
      } catch (error) {
        return next(error);
      }
    },

    getMessages: async (req, res, next) => {
      try {
        const { channelId } = req.params;
        const messages = await Message.find({ channel: channelId }).populate("sender", "username");
        return ok(res, {
          data: {
            messages: messages.map(serializeMessage),
          },
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}
