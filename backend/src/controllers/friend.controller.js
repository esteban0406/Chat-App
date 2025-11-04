import mongoose from "mongoose";
import FriendRequest from "../models/friendRequest.js";
import User from "../services/user/User.model.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const serializeFriendRequest = (request) => {
  const plain = request.toObject();
  plain.id = plain._id.toString();
  plain.from = plain.from.toString();
  plain.to = plain.to.toString();
  delete plain._id;
  delete plain.__v;
  return plain;
};

const serializeSummaryUser = (user) => {
  if (!user) return null;
  if (typeof user.toObject === "function") {
    const { _id, username, email } = user.toObject();
    return {
      id: _id.toString(),
      username,
      email,
    };
  }

  return {
    id: user._id?.toString() ?? user.id,
    username: user.username,
    email: user.email,
  };
};

// 📌 Enviar solicitud de amistad
export const sendFriendRequest = async (req, res, next) => {
  try {
    const from = req.user._id;
    const { to } = req.body;

    // Validación básica
    if (!to) {
      throw validationError("Falta el usuario destinatario (to)");
    }

    // Validar que `to` sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(to)) {
      throw validationError("ID de usuario no válido");
    }

    // No se puede enviar a sí mismo
    if (from.toString() === to.toString()) {
      throw createHttpError(400, "No puedes enviarte una solicitud a ti mismo", {
        code: "INVALID_OPERATION",
      });
    }

    // Verificar que el destinatario exista
    const receiver = await User.findById(to);
    if (!receiver) {
      throw createHttpError(404, "El usuario destinatario no existe", {
        code: "USER_NOT_FOUND",
      });
    }

    // Evitar solicitudes duplicadas (pendientes)
    const existing = await FriendRequest.findOne({ from, to, status: "pending" });
    if (existing) {
      throw createHttpError(409, "Ya enviaste una solicitud a este usuario", {
        code: "REQUEST_EXISTS",
      });
    }

    // Crear solicitud
    const request = new FriendRequest({ from, to, status: "pending" });
    await request.save();

    return ok(res, {
      status: 201,
      message: "Solicitud enviada",
      data: { request: serializeFriendRequest(request) },
    });
  } catch (error) {
    return next(error);
  }
};

// 📌 Responder a una solicitud (aceptar o rechazar)
export const respondFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      throw validationError("Estado inválido");
    }

    const request = await FriendRequest.findById(id);
    if (!request) {
      throw createHttpError(404, "Solicitud no encontrada", {
        code: "REQUEST_NOT_FOUND",
      });
    }

    request.status = status;
    await request.save();

    // Si se acepta, agregar en la lista de amigos de ambos usuarios
    if (status === "accepted") {
      await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
      await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });
    }

    return ok(res, {
      message: `Solicitud ${status}`,
      data: { request: serializeFriendRequest(request) },
    });
  } catch (error) {
    return next(error);
  }
};

// 📌 Obtener solicitudes pendientes para el usuario autenticado
export const getPendingFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({ to: userId, status: "pending" })
      .populate("from", "username email");

    const formatted = requests.map((r) => ({
      id: r._id.toString(),
      from: serializeSummaryUser(r.from),
      to: userId.toString(),
      type: "friend",
      status: r.status,
      createdAt: r.createdAt,
    }));

    return ok(res, {
      data: { requests: formatted },
    });
  } catch (error) {
    return next(error);
  }
};

// 📌 Obtener lista de amigos
export const getFriends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Buscar solicitudes aceptadas donde el usuario sea `from` o `to`
    const requests = await FriendRequest.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    });

    const friendIds = requests.map((r) =>
      r.from.toString() === userId.toString() ? r.to : r.from
    );

    const friends = await User.find({ _id: { $in: friendIds } }).select("username email");

    return ok(res, {
      data: {
        friends: friends.map(serializeSummaryUser),
      },
    });
  } catch (error) {
    return next(error);
  }
};
