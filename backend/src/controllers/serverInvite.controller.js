import ServerInvite from "../models/serverInvite.js";
import Server from "../models/Server.js";

export const sendServerInvite = async (req, res) => {
  try {
    const { to, serverId } = req.body;
    const from = req.user._id;

    // Verificar si ya existe una invitación
    const existingInvite = await ServerInvite.findOne({ from, to, server: serverId, status: "pending" });
    if (existingInvite) {
      return res.status(400).json({ error: "Ya existe una invitación pendiente a este usuario para este servidor" });
    }

    // Crear nueva invitación
    const invite = new ServerInvite({ from, to, server: serverId });
    await invite.save();

    res.status(201).json(invite);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Invitación duplicada no permitida" });
    }
    res.status(500).json({ error: err.message });
  }
};

// ✅ Aceptar/Rechazar invitación
export const respondServerInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { status } = req.body;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: "Invitación no encontrada" });

    invite.status = status;
    await invite.save();

    if (status === "accepted") {
      await Server.findByIdAndUpdate(invite.server, {
        $addToSet: { members: invite.to }
      });
    }

    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📋 Obtener invitaciones pendientes
export const getPendingServerInvites = async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar invitaciones con populate
    const invites = await ServerInvite.find({ to: userId, status: "pending" })
      .populate("from", "username email")
      .populate("server", "name");

    // Filtrar servidores eliminados
    const validInvites = invites.filter(invite => invite.server);

    res.json(validInvites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
