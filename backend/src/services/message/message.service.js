import Message from "./Message.model.js";
import Channel from "../channel/Channel.model.js";
import { createHttpError, validationError } from "../../utils/httpError.js";
import { createBetterAuthUserRepository } from "../user/betterAuthUser.repository.js";

const toStringId = (value) => value?.toString?.() ?? String(value);

const toPlainObject = (doc) =>
  doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

const sanitizeSender = (sender) => {
  if (!sender) {
    return undefined;
  }

  if (typeof sender === "object") {
    const plain = toPlainObject(sender);
    const id = toStringId(plain._id ?? plain.id ?? sender);
    return {
      id,
      username: plain.username,
    };
  }

  return toStringId(sender);
};

const sanitizeMessageDocument = (message) => {
  if (!message) {
    return null;
  }

  const plain = toPlainObject(message);
  const id = toStringId(plain._id ?? plain.id ?? message);
  const { _id, __v, sender, channel, ...rest } = plain;

  return {
    id,
    ...rest,
    sender: sanitizeSender(sender),
    channel: channel ? toStringId(channel) : undefined,
  };
};

export function createMessageService({
  MessageModel = Message,
  ChannelModel = Channel,
  userRepository = createBetterAuthUserRepository(),
} = {}) {
  const mapSenderSummaries = async (senderIds = []) => {
    if (!Array.isArray(senderIds) || !senderIds.length) {
      return new Map();
    }
    const uniqueIds = Array.from(new Set(senderIds.map((id) => toStringId(id)))).filter(Boolean);
    if (!uniqueIds.length) {
      return new Map();
    }

    const users = await userRepository.findByIds(uniqueIds);
    const map = new Map();
    for (const user of users) {
      if (!user?.id) continue;
      map.set(toStringId(user.id), {
        id: toStringId(user.id),
        username: user.username,
      });
    }
    return map;
  };
  const ensureChannelExists = async (channelId) => {
    if (!channelId) {
      throw validationError("El canal es requerido", { field: "channelId" });
    }

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      throw createHttpError(404, "Canal no encontrado", {
        code: "CHANNEL_NOT_FOUND",
      });
    }

    return channel;
  };

  const createMessage = async ({ text, senderId, channelId }) => {
    if (!text || !senderId || !channelId) {
      throw validationError("Faltan campos obligatorios", {
        fields: ["text", "senderId", "channelId"],
      });
    }

    const message = new MessageModel({
      text,
      sender: senderId,
      channel: channelId,
    });
    await message.save();

    const channel = await ensureChannelExists(channelId);
    channel.messages = Array.isArray(channel.messages) ? channel.messages : [];
    channel.messages.push(message._id);
    await channel.save();

    const sanitized = sanitizeMessageDocument(message);
    const sender = await userRepository.findById(senderId);
    if (sender) {
      sanitized.sender = {
        id: toStringId(sender.id),
        username: sender.username,
      };
    }

    return sanitized;
  };

  const listMessages = async ({ channelId }) => {
    if (!channelId) {
      throw validationError("El canal es requerido", { field: "channelId" });
    }

    const messages = await MessageModel.find({ channel: channelId });
    const sanitizedMessages = messages.map(sanitizeMessageDocument);

    const senderMap = await mapSenderSummaries(
      sanitizedMessages.map((message) => message.sender?.id ?? message.sender),
    );

    return sanitizedMessages.map((message) => {
      const senderId = toStringId(message.sender?.id ?? message.sender);
      const senderSummary = senderMap.get(senderId);
      return {
        ...message,
        sender: senderSummary ?? message.sender,
      };
    });
  };

  return {
    createMessage,
    listMessages,
    sanitizeMessage: sanitizeMessageDocument,
  };
}

export const defaultMessageService = createMessageService();
