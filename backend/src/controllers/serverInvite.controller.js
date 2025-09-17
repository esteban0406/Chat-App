import ServerInvite from "../models/serverInvite.js";
import Server from "../models/serverInvite.js";


export const sendServerInvite = async (req, res) => {
  try {
    const { serverId, to } = req.body;
    const from = req.user._id; // 👈 lo tomamos del token (authMiddleware)

    if (!serverId || !to) {
      return res.status(400).json({ error: "serverId y destinatario son requeridos" });
    }

    const invite = new ServerInvite({
      from,     // ✅ remitente
      to,       // destinatario
      server: serverId,
      status: "pending"
    });

    await invite.save();
    res.status(201).json(invite);
  } catch (err) {
    console.error("Error enviando invitación:", err);
    res.status(500).json({ error: err.message });
  }
};

export const respondServerInvite = async (req, res) => {
  try {
    const { inviteId, status } = req.body;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: "Invitación no encontrada" });

    invite.status = status;
    await invite.save();

    if (status === "accepted") {
      await Server.findByIdAndUpdate(invite.server, {
        $addToSet: { members: invite.to }
      });
    }

    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
