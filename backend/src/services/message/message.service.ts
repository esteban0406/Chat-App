// src/services/message/message.service.ts
import { Types } from "mongoose";
import Message, { IMessageDocument } from "./Message.model.js";
import Channel, { IChannelDocument } from "../channel/Channel.model.js";
import { createHttpError, validationError } from "../../utils/httpError.js";
import {
  betterAuthUserApi,
  BetterAuthUserApi,
} from "../user/betterAuthUser.api.js";
import type {
  AuthContext,
  SanitizedUser,
} from "../../auth/betterAuth.types.js";

// =======================
// Types
// =======================

export interface SenderSummary {
  id: string;
  username?: string;
}

interface CreateMessageParams {
  text: string;
  senderId: string;
  channelId: string;
  authContext?: AuthContext;
}

interface CreateMessageResult {
  message: IMessageDocument;
  sender: SenderSummary | null;
}

interface ListMessagesParams {
  channelId: string;
  authContext?: AuthContext;
}

interface MessageWithSender {
  message: IMessageDocument;
  sender: SenderSummary | null;
}

interface MessageServiceDeps {
  MessageModel?: typeof Message;
  ChannelModel?: typeof Channel;
  userApi?: BetterAuthUserApi;
}

export interface MessageService {
  createMessage(params: CreateMessageParams): Promise<CreateMessageResult>;
  listMessages(params: ListMessagesParams): Promise<MessageWithSender[]>;
}

// =======================
// Helper Functions
// =======================

const toStringId = (value: Types.ObjectId | string | unknown): string => {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    return (value as { toString(): string }).toString();
  }
  return String(value);
};

const toSenderSummary = (
  user: SanitizedUser | unknown
): SenderSummary | null => {
  if (!user) return null;

  if (typeof user === "object" && user !== null) {
    const u = user as Record<string, unknown>;
    const id = toStringId(u._id ?? u.id);
    return {
      id,
      username: (u.username ?? u.name ?? u.email) as string | undefined,
    };
  }

  return { id: toStringId(user) };
};

// =======================
// Service Factory
// =======================

export function createMessageService({
  MessageModel = Message,
  ChannelModel = Channel,
  userApi = betterAuthUserApi,
}: MessageServiceDeps = {}): MessageService {
  const getSenderSummariesMap = async (
    senderIds: (string | Types.ObjectId)[] = [],
    authContext?: AuthContext
  ): Promise<Map<string, SenderSummary>> => {
    if (!Array.isArray(senderIds) || senderIds.length === 0) {
      return new Map();
    }

    const uniqueIds = Array.from(
      new Set(senderIds.map((id) => toStringId(id)))
    ).filter(Boolean);
    if (!uniqueIds.length) {
      return new Map();
    }

    const users = await userApi.getUsersByIds(uniqueIds, authContext);
    const map = new Map<string, SenderSummary>();

    for (const user of users) {
      const summary = toSenderSummary(user);
      if (summary?.id) {
        map.set(summary.id, summary);
      }
    }
    return map;
  };

  const ensureChannelExists = async (
    channelId: string
  ): Promise<IChannelDocument> => {
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

  const createMessage = async ({
    text,
    senderId,
    channelId,
    authContext,
  }: CreateMessageParams): Promise<CreateMessageResult> => {
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

    const senderUser = await userApi.getUserById(senderId, authContext);
    const sender = toSenderSummary(senderUser);

    return {
      message,
      sender,
    };
  };

  const listMessages = async ({
    channelId,
    authContext,
  }: ListMessagesParams): Promise<MessageWithSender[]> => {
    if (!channelId) {
      throw validationError("El canal es requerido", { field: "channelId" });
    }

    const messages = await MessageModel.find({ channel: channelId });

    const senderMap = await getSenderSummariesMap(
      messages.map((m) => m.sender),
      authContext
    );

    return messages.map((message) => {
      const senderId = toStringId(message.sender);
      return {
        message,
        sender: senderMap.get(senderId) ?? { id: senderId, username: senderId },
      };
    });
  };

  return {
    createMessage,
    listMessages,
  };
}

export const defaultMessageService = createMessageService();
