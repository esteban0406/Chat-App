import Server from "../models/Server.js";
import ServerInvite from "../models/serverInvite.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const serializeInvite = (invite) => {
  const plain = invite.toObject();
  plain.id = plain._id.toString();
  if (plain.from) {
    plain.from = plain.from.toString();
  }
  if (plain.to) {
    plain.to = plain.to.toString();
  }
  if (plain.server) {
    plain.server = plain.server.toString();
  }
  delete plain._id;
  delete plain.__v;
  return plain;
};

const serializeInviteWithDetails = (invite) => {
  const base = serializeInvite(invite);

  if (invite.from && typeof invite.from === "object") {
    const from = invite.from.toObject ? invite.from.toObject() : invite.from;
    base.from = {
      id: from._id?.toString(),
      username: from.username,
      email: from.email,
    };
  }

  if (invite.server && typeof invite.server === "object") {
    const server = invite.server.toObject ? invite.server.toObject() : invite.server;
    base.server = {
      id: server._id?.toString(),
      name: server.name,
    };
  }

  return base;
};
// Enviar invitación
export const sendServerInvite = async (req, res, next) => {
  try {
    const { to, serverId } = req.body;
    const from = req.user._id;

    if (!to || !serverId) {
      throw validationError("El destinatario y el servidor son requeridos");
    }

    // Verificar duplicados pendientes
    const existingInvite = await ServerInvite.findOne({
      from,
      to,
      server: serverId,
      status: "pending",
    });
    if (existingInvite) {
      throw createHttpError(
        409,
        "Ya existe una invitación pendiente a este usuario para este servidor",
        { code: "INVITE_EXISTS" }
      );
    }

    const invite = new ServerInvite({ from, to, server: serverId });
    await invite.save();

    return ok(res, {
      status: 201,
      message: "Invitación enviada",
      data: { invite: serializeInvite(invite) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        createHttpError(409, "Invitación duplicada no permitida", { code: "INVITE_EXISTS" })
      );
    }
    return next(error);
  }
};

// Aceptar invitación
export const acceptServerInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) {
      throw createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
    }

    invite.status = "accepted";
    await invite.save();

    await Server.findByIdAndUpdate(invite.server, {
      $addToSet: { members: invite.to },
    });

    return ok(res, {
      message: "Invitación aceptada",
      data: { invite: serializeInvite(invite) },
    });
  } catch (error) {
    return next(error);
  }
};

// Rechazar invitación
export const rejectServerInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) {
      throw createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
    }

    invite.status = "rejected";
    await invite.save();

    return ok(res, {
      message: "Invitación rechazada",
      data: { invite: serializeInvite(invite) },
    });
  } catch (error) {
    return next(error);
  }
};

// Obtener invitaciones pendientes
export const getPendingServerInvites = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const invites = await ServerInvite.find({ to: userId, status: "pending" })
      .populate("from", "username email")
      .populate("server", "name");

    const validInvites = invites
      .filter((invite) => invite.server)
      .map(serializeInviteWithDetails);

    return ok(res, {
      data: { invites: validInvites },
    });
  } catch (error) {
    return next(error);
  }
};
