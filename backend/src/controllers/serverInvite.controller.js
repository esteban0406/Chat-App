import ServerInvite from "../models/serverInvite.js";
import Server from "../models/Server.js";

// Enviar invitación
export const sendServerInvite = async (req, res) => {
  try {
    const { to, serverId } = req.body;
    const from = req.user._id;

    // Verificar duplicados pendientes
    const existingInvite = await ServerInvite.findOne({
      from,
      to,
      server: serverId,
      status: "pending",
    });
    if (existingInvite) {
      return res.status(400).json({
        error: "Ya existe una invitación pendiente a este usuario para este servidor",
      });
    }

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

// Aceptar invitación
export const acceptServerInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: "Invitación no encontrada" });

    invite.status = "accepted";
    await invite.save();

    await Server.findByIdAndUpdate(invite.server, {
      $addToSet: { members: invite.to },
    });

    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Rechazar invitación
export const rejectServerInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: "Invitación no encontrada" });

    invite.status = "rejected";
    await invite.save();

    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener invitaciones pendientes
export const getPendingServerInvites = async (req, res) => {
  try {
    const userId = req.user._id;

    const invites = await ServerInvite.find({ to: userId, status: "pending" })
      .populate("from", "username email")
      .populate("server", "name");

    const validInvites = invites.filter((invite) => invite.server);

    res.json(validInvites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
