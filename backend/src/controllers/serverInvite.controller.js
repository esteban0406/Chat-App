import ServerInvite from "../models/serverInvite.js";
import Server from "../models/Server.js";

export const sendServerInvite = async (req, res) => {
  try {
    const { serverId, to } = req.body;
    const from = req.user._id;

    if (!serverId || !to) {
      return res
        .status(400)
        .json({ error: "serverId y destinatario son requeridos" });
    }

    const invite = new ServerInvite({
      from,
      to,
      server: serverId,
      status: "pending",
    });

    await invite.save();
    res.status(201).json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const respondServerInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { status } = req.body;

    const invite = await ServerInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: "Invitación no encontrada" });

    invite.status = status;
    await invite.save();

    if (status === "accepted") {
      if (!invite.to || !invite.server) {
        return res.status(400).json({ error: "Invitación inválida" });
      }

      await Server.findByIdAndUpdate(invite.server, {
        $addToSet: { members: invite.to },
      });
    }

    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getPendingServerInvites = async (req, res) => {
  try {
    const userId = req.user._id;
    const invites = await ServerInvite.find({ to: userId, status: "pending" })
      .populate("from", "username")
      .populate("server", "name");

    const validInvites = [];
    for (const invite of invites) {
      if (!invite.server) {
        invite.status = "rejected";
        await invite.save();
      } else {
        validInvites.push(invite);
      }
    }

    res.json(validInvites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
