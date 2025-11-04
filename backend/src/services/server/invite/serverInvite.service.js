import ServerInvite from "./ServerInvite.model.js";
import Server from "../Server.model.js";
import { createHttpError, validationError } from "../../../utils/httpError.js";

const toStringId = (value) => value?.toString?.() ?? String(value);

const toPlainObject = (doc) =>
  doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

const sanitizeReference = (value) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "object") {
    return toStringId(value._id ?? value.id ?? value);
  }

  return toStringId(value);
};

const sanitizeInvite = (invite) => {
  if (!invite) {
    return null;
  }

  const plain = toPlainObject(invite);
  const id = toStringId(plain._id ?? plain.id ?? invite);
  const { _id, __v, from, to, server, ...rest } = plain;

  return {
    id,
    ...rest,
    from: sanitizeReference(from),
    to: sanitizeReference(to),
    server: sanitizeReference(server),
  };
};

const sanitizeInviteWithDetails = (invite) => {
  const base = sanitizeInvite(invite);
  if (!base) {
    return null;
  }

  if (invite?.from && typeof invite.from === "object") {
    const from = toPlainObject(invite.from);
    base.from = {
      id: toStringId(from._id ?? from.id ?? invite.from),
      username: from.username,
      email: from.email,
    };
  }

  if (invite?.server && typeof invite.server === "object") {
    const server = toPlainObject(invite.server);
    base.server = {
      id: toStringId(server._id ?? server.id ?? invite.server),
      name: server.name,
    };
  }

  return base;
};

export function createServerInviteService({
  ServerInviteModel = ServerInvite,
  ServerModel = Server,
} = {}) {
  const sendInvite = async ({ fromUserId, toUserId, serverId }) => {
    if (!fromUserId || !toUserId || !serverId) {
      throw validationError("El remitente, destinatario y servidor son requeridos", {
        fields: ["fromUserId", "toUserId", "serverId"],
      });
    }

    const existingInvite = await ServerInviteModel.findOne({
      from: fromUserId,
      to: toUserId,
      server: serverId,
      status: "pending",
    });

    if (existingInvite) {
      throw createHttpError(
        409,
        "Ya existe una invitación pendiente a este usuario para este servidor",
        { code: "INVITE_EXISTS" },
      );
    }

    const invite = new ServerInviteModel({
      from: fromUserId,
      to: toUserId,
      server: serverId,
    });

    try {
      await invite.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw createHttpError(409, "Invitación duplicada no permitida", {
          code: "INVITE_EXISTS",
        });
      }
      throw error;
    }

    return sanitizeInvite(invite);
  };

  const acceptInvite = async ({ inviteId, userId }) => {
    if (!inviteId) {
      throw validationError("El inviteId es requerido", { field: "inviteId" });
    }

    const invite = await ServerInviteModel.findById(inviteId);
    if (!invite) {
      throw createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
    }

    invite.status = "accepted";
    await invite.save();

    await ServerModel.findByIdAndUpdate(invite.server, {
      $addToSet: { members: invite.to },
    });

    return sanitizeInvite(invite);
  };

  const rejectInvite = async ({ inviteId, userId }) => {
    if (!inviteId) {
      throw validationError("El inviteId es requerido", { field: "inviteId" });
    }

    const invite = await ServerInviteModel.findById(inviteId);
    if (!invite) {
      throw createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
    }

    invite.status = "rejected";
    await invite.save();

    return sanitizeInvite(invite);
  };

  const listPendingInvites = async ({ userId }) => {
    if (!userId) {
      throw createHttpError(401, "No autorizado", { code: "AUTH_REQUIRED" });
    }

    const invites = await ServerInviteModel.find({ to: userId, status: "pending" })
      .populate("from", "username email")
      .populate("server", "name");

    return invites
      .filter((invite) => Boolean(invite?.server))
      .map((invite) => sanitizeInviteWithDetails(invite));
  };

  return {
    sendInvite,
    acceptInvite,
    rejectInvite,
    listPendingInvites,
    sanitizeInvite,
    sanitizeInviteWithDetails,
  };
}

export const defaultServerInviteService = createServerInviteService();
