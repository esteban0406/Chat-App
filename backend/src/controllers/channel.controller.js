import Channel from "../models/Channel.js";
import Server from "../models/Server.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const serializeChannel = (channel) => {
  const plain = channel.toObject();
  plain.id = plain._id.toString();
  if (plain.server) {
    plain.server = plain.server.toString();
  }
  if (Array.isArray(plain.messages)) {
    plain.messages = plain.messages.map((message) =>
      message?.toString?.() ?? message
    );
  }
  delete plain._id;
  delete plain.__v;
  return plain;
};

export const createChannel = async (req, res, next) => {
  try {
    const { name, type, serverId } = req.body;
    const userId = req.user._id; 

    if (!name || !serverId) {
      throw validationError("El nombre y el serverId son requeridos");
    }

    const server = await Server.findById(serverId);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
    }

    const isMember = server.members.some((member) => member.toString() === userId.toString());
    if (!isMember) {
      throw createHttpError(403, "No eres miembro de este servidor", { code: "FORBIDDEN" });
    }

    // Crear canal
    const channel = new Channel({
      name,
      type: type || "text",
      server: serverId,
    });
    await channel.save();

    // Asociar canal al servidor
    server.channels.push(channel._id);
    await server.save();

    return ok(res, {
      status: 201,
      message: "Canal creado correctamente",
      data: { channel: serializeChannel(channel) },
    });
  } catch (error) {
    return next(error);
  }
};

export const getChannels = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId).populate("channels");
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
    }

    const isMember = server.members.some((member) => member.toString() === userId.toString());
    if (!isMember) {
      throw createHttpError(403, "No eres miembro de este servidor", { code: "FORBIDDEN" });
    }

    return ok(res, {
      data: {
        channels: server.channels.map(serializeChannel),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw createHttpError(404, "Canal no encontrado", { code: "CHANNEL_NOT_FOUND" });
    }

    await Server.findByIdAndUpdate(channel.server, {
      $pull: { channels: channelId }
    });

    await Channel.findByIdAndDelete(channelId);

    return ok(res, {
      message: "Canal eliminado correctamente",
      data: { channelId },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name) {
      throw validationError("El nombre es requerido");
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw createHttpError(404, "Canal no encontrado", { code: "CHANNEL_NOT_FOUND" });
    }

    const server = await Server.findById(channel.server);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
    }

    const isMember = server.members.some((member) => member.toString() === userId.toString());
    if (!isMember) {
      throw createHttpError(403, "No eres miembro de este servidor", { code: "FORBIDDEN" });
    }

    channel.name = name;
    await channel.save();

    return ok(res, {
      message: "Canal actualizado correctamente",
      data: { channel: serializeChannel(channel) },
    });
  } catch (error) {
    return next(error);
  }
};
