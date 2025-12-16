import Channel from "../channel/Channel.model.js";
import Server from "./Server.model.js";
import { createHttpError, validationError } from "../../utils/httpError.js";
import { createBetterAuthUserRepository } from "../user/betterAuthUser.repository.js";

const toStringId = (value) => value?.toString?.() ?? String(value);

const sanitizeMember = (member) => {
  if (!member) return null;

  if (typeof member === "object") {
    const base = member.toObject ? member.toObject() : member;
    const id = toStringId(base._id ?? base.id ?? member);
    return {
      id,
      _id: id,
      username: base.username,
      email: base.email,
      avatar: base.avatar,
    };
  }

  const id = toStringId(member);
  return { id, _id: id };
};

const sanitizeChannel = (channel) => {
  if (!channel) return null;
  const plain = typeof channel.toObject === "function" ? channel.toObject() : { ...channel };
  const id = toStringId(plain._id ?? plain.id ?? channel);
  const { _id, __v, ...rest } = plain;
  return { ...rest, id };
};

const sanitizeServerDocument = (server) => {
  if (!server) return null;

  const plain = typeof server.toObject === "function" ? server.toObject() : { ...server };
  const id = toStringId(plain._id ?? plain.id ?? server);

  let owner = plain.owner;
  if (owner) {
    owner =
      typeof owner === "object"
        ? toStringId(owner._id ?? owner.id ?? owner)
        : toStringId(owner);
  }

  const { _id, __v, ...rest } = plain;

  return {
    ...rest,
    id,
    owner,
    members: Array.isArray(plain.members)
      ? plain.members
          .map(sanitizeMember)
          .filter((member) => member !== null)
      : [],
    channels: Array.isArray(plain.channels)
      ? plain.channels
          .map((channel) => {
            if (!channel) return null;
            if (typeof channel === "object") {
              if (typeof channel.toObject === "function") {
                return sanitizeChannel(channel);
              }
              return sanitizeChannel(channel);
            }
            return toStringId(channel);
          })
          .filter((channel) => channel !== null)
      : [],
  };
};

export function createServerService({
  ServerModel = Server,
  ChannelModel = Channel,
  userRepository = createBetterAuthUserRepository(),
} = {}) {
  const getUserSummariesMap = async (userIds = []) => {
    if (!Array.isArray(userIds) || !userIds.length) {
      return new Map();
    }
    const uniqueIds = Array.from(new Set(userIds.map((id) => toStringId(id)))).filter(Boolean);
    if (!uniqueIds.length) {
      return new Map();
    }
    const users = await userRepository.findByIds(uniqueIds);
    const map = new Map();
    for (const user of users) {
      if (!user?.id) continue;
      map.set(toStringId(user.id), {
        id: toStringId(user.id),
        _id: toStringId(user.id),
        username: user.username,
        email: user.email,
        avatar: user.avatar ?? user.image,
      });
    }
    return map;
  };

  const hydrateServerMembers = async (servers) => {
    if (!servers) return servers;
    const list = Array.isArray(servers) ? servers : [servers];
    if (list.length === 0) return Array.isArray(servers) ? [] : null;

    const plainServers = list.map((server) =>
      typeof server?.toObject === "function" ? server.toObject() : { ...server },
    );

    const memberIds = new Set();
    for (const server of plainServers) {
      const members = Array.isArray(server.members) ? server.members : [];
      for (const member of members) {
        const id = toStringId(member?._id ?? member?.id ?? member);
        if (id) {
          memberIds.add(id);
        }
      }
    }

    const memberMap = await getUserSummariesMap([...memberIds]);

    const hydrated = plainServers.map((server) => ({
      ...server,
      members: Array.isArray(server.members)
        ? server.members.map((member) => {
            const id = toStringId(member?._id ?? member?.id ?? member);
            return memberMap.get(id) ?? sanitizeMember(member);
          })
        : [],
    }));

    return Array.isArray(servers) ? hydrated : hydrated[0];
  };

  const ensureServerExists = async (serverId) => {
    const server = await ServerModel.findById(serverId);
    if (!server) {
      throw createHttpError(404, "Servidor no encontrado", {
        code: "SERVER_NOT_FOUND",
      });
    }
    return server;
  };

  const createServer = async ({ name, description = "", ownerId }) => {
    if (!name || typeof name !== "string" || !name.trim()) {
      throw validationError("El nombre es requerido", { field: "name" });
    }

    if (!ownerId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const trimmedName = name.trim();
    const server = new ServerModel({
      name: trimmedName,
      description: description || "",
      owner: ownerId,
      members: [ownerId],
    });
    await server.save();

    const channel = new ChannelModel({
      name: "general",
      type: "text",
      server: server._id,
    });
    await channel.save();

    server.channels.push(channel._id);
    await server.save();

    const hydrated = await hydrateServerMembers(server);

    return {
      server: sanitizeServerDocument(hydrated),
      defaultChannel: sanitizeChannel(channel),
    };
  };

  const joinServer = async ({ serverId, userId }) => {
    if (!serverId || !userId) {
      throw validationError("serverId y userId requeridos", {
        fields: ["serverId", "userId"],
      });
    }

    const server = await ensureServerExists(serverId);

    const normalizedUserId = toStringId(userId);
    const alreadyMember = server.members.some(
      (member) => toStringId(member) === normalizedUserId,
    );

    if (!alreadyMember) {
      server.members.push(userId);
      await server.save();
    }

    await server.populate("channels");
    const hydrated = await hydrateServerMembers(server);

    return sanitizeServerDocument(hydrated);
  };

  const listServersForMember = async ({ userId }) => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const servers = await ServerModel.find({ members: userId }).populate("channels");

    const hydrated = await hydrateServerMembers(servers);

    return hydrated.map(sanitizeServerDocument);
  };

  const deleteServer = async ({ serverId }) => {
    if (!serverId) {
      throw validationError("Se requiere el serverId", { field: "serverId" });
    }

    await ChannelModel.deleteMany({ server: serverId });
    await ServerModel.findByIdAndDelete(serverId);
  };

  const removeMember = async ({ serverId, memberId, requesterId }) => {
    if (!serverId || !memberId) {
      throw validationError("serverId y memberId requeridos", {
        fields: ["serverId", "memberId"],
      });
    }

    if (!requesterId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const server = await ensureServerExists(serverId);

    if (toStringId(server.owner) !== toStringId(requesterId)) {
      throw createHttpError(403, "Solo el dueño puede eliminar miembros", {
        code: "FORBIDDEN",
      });
    }

    const normalizedMemberId = toStringId(memberId);
    const isMember = server.members.some(
      (member) => toStringId(member) === normalizedMemberId,
    );

    if (!isMember) {
      throw validationError("El miembro no pertenece al servidor", {
        field: "memberId",
      });
    }

    server.members = server.members.filter(
      (member) => toStringId(member) !== normalizedMemberId,
    );
    await server.save();

    await server.populate("channels");
    const hydrated = await hydrateServerMembers(server);

    return sanitizeServerDocument(hydrated);
  };

  const leaveServer = async ({ serverId, userId }) => {
    if (!serverId) {
      throw validationError("Se requiere el serverId", { field: "serverId" });
    }

    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const server = await ensureServerExists(serverId);
    const normalizedUserId = toStringId(userId);

    if (toStringId(server.owner) === normalizedUserId) {
      throw createHttpError(400, "El dueño no puede abandonar su servidor", {
        code: "INVALID_OPERATION",
      });
    }

    const isMember = server.members.some(
      (member) => toStringId(member) === normalizedUserId,
    );

    if (!isMember) {
      throw createHttpError(400, "No perteneces a este servidor", {
        code: "INVALID_OPERATION",
      });
    }

    server.members = server.members.filter(
      (member) => toStringId(member) !== normalizedUserId,
    );
    await server.save();
  };

  return {
    createServer,
    joinServer,
    listServersForMember,
    deleteServer,
    removeMember,
    leaveServer,
    sanitizeServer: sanitizeServerDocument,
    sanitizeChannel,
  };
}

export const defaultServerService = createServerService();
