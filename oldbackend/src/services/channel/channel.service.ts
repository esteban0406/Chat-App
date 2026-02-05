// src/services/channel/channel.service.ts
import { Types } from "mongoose";
import Channel, { IChannelDocument, ChannelType } from "./Channel.model.js";
import Server, { IServerDocument } from "../server/Server.model.js";
import { createHttpError, validationError } from "../../utils/httpError.js";

// =======================
// Types
// =======================

interface CreateChannelParams {
  name: string;
  type?: ChannelType;
  serverId: string;
  requesterId: string;
}

interface ListChannelsParams {
  serverId: string;
  requesterId: string;
}

interface UpdateChannelParams {
  channelId: string;
  name: string;
  requesterId: string;
}

interface DeleteChannelParams {
  channelId: string;
}

interface ChannelServiceDeps {
  ChannelModel?: typeof Channel;
  ServerModel?: typeof Server;
}

export interface ChannelService {
  createChannel(params: CreateChannelParams): Promise<IChannelDocument>;
  listChannelsForServer(params: ListChannelsParams): Promise<IChannelDocument[]>;
  updateChannel(params: UpdateChannelParams): Promise<IChannelDocument>;
  deleteChannel(params: DeleteChannelParams): Promise<void>;
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

// =======================
// Service Factory
// =======================

export function createChannelService({
  ChannelModel = Channel,
  ServerModel = Server,
}: ChannelServiceDeps = {}): ChannelService {

  const ensureServerExists = async ({
    serverId,
    populateChannels = false,
  }: {
    serverId: string;
    populateChannels?: boolean;
  }): Promise<IServerDocument> => {
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

  const ensureMembership = (server: IServerDocument, userId: string): void => {
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

  const createChannel = async ({
    name,
    type = "text",
    serverId,
    requesterId,
  }: CreateChannelParams): Promise<IChannelDocument> => {
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

    return channel;
  };

  const listChannelsForServer = async ({
    serverId,
    requesterId,
  }: ListChannelsParams): Promise<IChannelDocument[]> => {
    const server = await ensureServerExists({
      serverId,
      populateChannels: true,
    });

    ensureMembership(server, requesterId);

    return Array.isArray(server.channels)
      ? (server.channels as unknown as IChannelDocument[])
      : [];
  };

  const updateChannel = async ({
    channelId,
    name,
    requesterId,
  }: UpdateChannelParams): Promise<IChannelDocument> => {
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

    const server = await ensureServerExists({ serverId: toStringId(channel.server) });
    ensureMembership(server, requesterId);

    channel.name = name;
    await channel.save();

    return channel;
  };

  const deleteChannel = async ({ channelId }: DeleteChannelParams): Promise<void> => {
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
  };
}

export const defaultChannelService = createChannelService();
