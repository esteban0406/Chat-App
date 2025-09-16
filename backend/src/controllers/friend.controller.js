import FriendRequest from "../models/friendRequest.js";
import User from "../models/User.js";

// 📌 Enviar solicitud de amistad
export const sendFriendRequest = async (req, res) => {
  try {
    const from = req.user._id; // ✅ Ahora viene del authMiddleware
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Falta el usuario destinatario (to)" });
    }

    // Verificar que no se envíe a sí mismo
    if (from.toString() === to) {
      return res.status(400).json({ error: "No puedes enviarte una solicitud a ti mismo" });
    }

    // Verificar que no exista ya una solicitud pendiente
    const existing = await FriendRequest.findOne({ from, to, status: "pending" });
    if (existing) {
      return res.status(400).json({ error: "Ya enviaste una solicitud a este usuario" });
    }

    const request = new FriendRequest({ from, to, status: "pending" });
    await request.save();

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Responder a una solicitud (aceptar/rechazar)
export const respondFriendRequest = async (req, res) => {
  try {
    const { id } = req.params; // id de la invitación
    const { status } = req.body; // "accepted" o "rejected"

    const request = await FriendRequest.findById(id);

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    request.status = status;
    await request.save();

    // Si se aceptó → agregar a amigos
    if (status === "accepted") {
      await User.findByIdAndUpdate(request.from, { $push: { friends: request.to } });
      await User.findByIdAndUpdate(request.to, { $push: { friends: request.from } });
    }

    res.json({ message: `Solicitud ${status}`, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Obtener solicitudes pendientes del usuario autenticado
export const getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ viene del token
    const requests = await FriendRequest.find({ to: userId, status: "pending" })
      .populate("from", "username email"); // mostrar info del remitente

    // 🔹 Formateamos los resultados
    const formatted = requests.map((r) => ({
      _id: r._id,
      from: r.from,        // aquí tienes username y email
      type: "friend",      // 👈 para que InviteItem funcione
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

