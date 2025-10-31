import Channel from "../models/Channel.js";
import Server from "../models/Server.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const serializeChannel = (channel) => {
  const plain = channel.toObject();
  plain.id = plain._id.toString();
  delete plain._id;
  delete plain.__v;
  return plain;
};

const serializePlainChannel = (channel) => {
  const { _id, __v, ...rest } = channel;
  return {
    ...rest,
    id: _id?.toString(),
  };
};

const serializeMember = (member) => {
  if (!member) return null;

  if (typeof member === "object") {
    const base = member.toObject ? member.toObject() : member;
    const id =
      base._id?.toString?.() ??
      base.id?.toString?.() ??
      member.toString?.() ??
      String(member);

    return {
      id,
      _id: id,
      username: base.username,
      email: base.email,
      avatar: base.avatar,
    };
  }

  const id = member.toString?.() ?? String(member);
  return { id, _id: id };
};

const serializeServer = (server) => {
  const plain = server.toObject();
  plain.id = plain._id.toString();
  if (plain.owner) {
    if (typeof plain.owner === "object") {
      const owner =
        plain.owner._id?.toString?.() ??
        plain.owner.id?.toString?.() ??
        plain.owner.toString?.();
      plain.owner = owner ?? String(plain.owner);
    } else {
      plain.owner = plain.owner.toString();
    }
  }
  plain.members = plain.members
    .map(serializeMember)
    .filter((member) => member !== null);
  if (plain.channels) {
    plain.channels = plain.channels.map((channel) =>
      channel && typeof channel === "object"
        ? typeof channel.toObject === "function"
          ? serializeChannel(channel)
          : serializePlainChannel(channel)
        : channel?.toString?.() ?? channel
    );
  }
  delete plain._id;
  delete plain.__v;
  return plain;
};

// ==================================================
// Crear servidor con canal por defecto
// ==================================================
export const createServer = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw validationError("El nombre es requerido");
    }

    const ownerId = req.user._id; // 👈 mantener ObjectId, no string

    const server = new Server({
      name,
      description: description || "",
      owner: ownerId,
      members: [ownerId],
    });

    await server.save();

    // canal por defecto
    const channel = new Channel({
      name: "general",
      type: "text",
      server: server._id,
    });
    await channel.save();

    server.channels.push(channel._id);
    await server.save();
    await server.populate("members", "username email avatar");

    return ok(res, {
      status: 201,
      message: "Servidor creado",
      data: {
        server: serializeServer(server),
        defaultChannel: serializeChannel(channel),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ==================================================
// Unirse a un servidor
// ==================================================
export const joinServer = async (req, res, next) => {
  try {
    const { serverId, userId } = req.body;

    if (!serverId || !userId) {
      throw validationError("serverId y userId requeridos");
    }

    const server = await Server.findById(serverId);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
    }

    const normalizedUserId = userId.toString();
    const alreadyMember = server.members.some(
      (m) => m.toString() === normalizedUserId
    );

    if (!alreadyMember) {
      server.members.push(normalizedUserId);
      await server.save();
    }

    await server.populate("members", "username email avatar");

    return ok(res, {
      message: "Usuario unido al servidor",
      data: { server: serializeServer(server) },
    });
  } catch (error) {
    return next(error);
  }
};

// ==================================================
// Obtener servidores donde es miembro
// ==================================================
export const getServers = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const servers = await Server.find({ members: userId })
      .populate("channels")
      .populate("members", "username email avatar");

    return ok(res, {
      data: {
        servers: servers.map(serializeServer),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ==================================================
// Eliminar un servidor
// ==================================================
export const deleteServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;

    if (!serverId) {
      throw validationError("Se requiere el serverId");
    }

    await Channel.deleteMany({ server: serverId });
    await Server.findByIdAndDelete(serverId);

    return ok(res, { message: "Servidor eliminado con éxito" });
  } catch (error) {
    return next(error);
  }
};

// ==================================================
// Eliminar miembro (solo dueño)
// ==================================================
export const removeMember = async (req, res, next) => {
  try {
    const { serverId, memberId } = req.params;

    if (!serverId || !memberId) {
      throw validationError("serverId y memberId requeridos");
    }

    const server = await Server.findById(serverId);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
    }

    if (server.owner.toString() !== req.user._id.toString()) {
      throw createHttpError(403, "Solo el dueño puede eliminar miembros", {
        code: "FORBIDDEN",
      });
    }

    const isMember = server.members.some(
      (m) => m.toString() === memberId.toString()
    );
    if (!isMember) {
      throw validationError("El miembro no pertenece al servidor");
    }

    server.members = server.members.filter(
      (m) => m.toString() !== memberId.toString()
    );
    await server.save();
    await server.populate("members", "username email avatar");

    return ok(res, {
      message: "Miembro eliminado",
      data: { server: serializeServer(server) },
    });
  } catch (error) {
    return next(error);
  }
};

// ==================================================
// Abandonar un servidor
// ==================================================
export const leaveServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id.toString();

    if (!serverId) {
      throw validationError("Se requiere el serverId");
    }

    const server = await Server.findById(serverId);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
    }

    if (server.owner.toString() === userId) {
      throw createHttpError(400, "El dueño no puede abandonar su servidor", {
        code: "INVALID_OPERATION",
      });
    }

    const isMember = server.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      throw createHttpError(400, "No perteneces a este servidor", {
        code: "INVALID_OPERATION",
      });
    }

    server.members = server.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    await server.save();

    return ok(res, { message: "Has salido del servidor" });
  } catch (error) {
    return next(error);
  }
};
