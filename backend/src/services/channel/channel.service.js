import Channel from "./Channel.model.js";
import Server from "../server/Server.model.js";
import { createHttpError, validationError } from "../../utils/httpError.js";

const toStringId = (value) => value?.toString?.() ?? String(value);

const toPlainObject = (doc) =>
  doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

const sanitizeChannelDocument = (channel) => {
  if (!channel) {
    return null;
  }

  const plain = toPlainObject(channel);
  const id = toStringId(plain._id ?? plain.id ?? channel);
  const { _id, __v, server, messages, ...rest } = plain;

  return {
    ...rest,
    id,
    server: server ? toStringId(server) : undefined,
    messages: Array.isArray(messages)
      ? messages.map((message) => toStringId(message))
      : [],
  };
};

export function createChannelService({
  ChannelModel = Channel,
  ServerModel = Server,
} = {}) {
  const ensureServerExists = async ({ serverId, populateChannels = false }) => {
    if (!serverId) {
      throw validationError("Se requiere el serverId", { field: "serverId" });
    }

    let query = ServerModel.findById(serverId);
    if (populateChannels) {
      query = query.populate("channels");
    }

    const server = await query;
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", {
        code: "SERVER_NOT_FOUND",
      });
    }

    return server;
  };

  const ensureMembership = (server, userId) => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const normalizedUserId = toStringId(userId);
    const isMember = Array.isArray(server.members)
      ? server.members.some((member) => toStringId(member) === normalizedUserId)
      : false;

    if (!isMember) {
      throw createHttpError(403, "No eres miembro de este servidor", {
        code: "FORBIDDEN",
      });
    }
  };

  const createChannel = async ({ name, type = "text", serverId, requesterId }) => {
    if (!name || !serverId) {
      throw validationError("El nombre y el serverId son requeridos", {
        fields: ["name", "serverId"],
      });
    }

    const server = await ensureServerExists({ serverId });
    ensureMembership(server, requesterId);

    const channel = new ChannelModel({
      name,
      type: type || "text",
      server: serverId,
    });

    await channel.save();

    server.channels = Array.isArray(server.channels) ? server.channels : [];
    server.channels.push(channel._id);
    await server.save();

    return sanitizeChannelDocument(channel);
  };

  const listChannelsForServer = async ({ serverId, requesterId }) => {
    const server = await ensureServerExists({
      serverId,
      populateChannels: true,
    });

    ensureMembership(server, requesterId);

    return Array.isArray(server.channels)
      ? server.channels.map(sanitizeChannelDocument)
      : [];
  };

  const updateChannel = async ({ channelId, name, requesterId }) => {
    if (!channelId) {
      throw validationError("Se requiere el channelId", { field: "channelId" });
    }

    if (!name) {
      throw validationError("El nombre es requerido", { field: "name" });
    }

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      throw createHttpError(404, "Canal no encontrado", {
        code: "CHANNEL_NOT_FOUND",
      });
    }

    const server = await ensureServerExists({ serverId: channel.server });
    ensureMembership(server, requesterId);

    channel.name = name;
    await channel.save();

    return sanitizeChannelDocument(channel);
  };

  const deleteChannel = async ({ channelId }) => {
    if (!channelId) {
      throw validationError("Se requiere el channelId", { field: "channelId" });
    }

    const channel = await ChannelModel.findById(channelId);
    if (!channel) {
      throw createHttpError(404, "Canal no encontrado", {
        code: "CHANNEL_NOT_FOUND",
      });
    }

    await ServerModel.findByIdAndUpdate(channel.server, {
      $pull: { channels: channelId },
    });

    await ChannelModel.findByIdAndDelete(channelId);
  };

  return {
    createChannel,
    listChannelsForServer,
    updateChannel,
    deleteChannel,
    sanitizeChannel: sanitizeChannelDocument,
  };
}

export const defaultChannelService = createChannelService();
