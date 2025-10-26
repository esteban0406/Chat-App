import FriendRequest from "../models/friendRequest.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// 📌 Enviar solicitud de amistad
export const sendFriendRequest = async (req, res) => {
  try {
    const from = req.user._id;
    const { to } = req.body;

    // Validación básica
    if (!to) {
      return res.status(400).json({ error: "Falta el usuario destinatario (to)" });
    }

    // Validar que `to` sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ error: "ID de usuario no válido" });
    }

    // No se puede enviar a sí mismo
    if (from.toString() === to.toString()) {
      return res.status(400).json({ error: "No puedes enviarte una solicitud a ti mismo" });
    }

    // Verificar que el destinatario exista
    const receiver = await User.findById(to);
    if (!receiver) {
      return res.status(400).json({ error: "El usuario destinatario no existe" });
    }

    // Evitar solicitudes duplicadas (pendientes)
    const existing = await FriendRequest.findOne({ from, to, status: "pending" });
    if (existing) {
      return res.status(400).json({ error: "Ya enviaste una solicitud a este usuario" });
    }

    // Crear solicitud
    const request = new FriendRequest({ from, to, status: "pending" });
    await request.save();

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Responder a una solicitud (aceptar o rechazar)
export const respondFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const request = await FriendRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    request.status = status;
    await request.save();

    // Si se acepta, agregar en la lista de amigos de ambos usuarios
    if (status === "accepted") {
      await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
      await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });
    }

    res.json({ message: `Solicitud ${status}`, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Obtener solicitudes pendientes para el usuario autenticado
export const getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({ to: userId, status: "pending" })
      .populate("from", "username email");

    const formatted = requests.map((r) => ({
      _id: r._id,
      from: r.from,
      type: "friend",
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Obtener lista de amigos
export const getFriends = async (req, res) => {
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

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
