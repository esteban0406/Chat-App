import ServerInvite from "../models/serverInvite.js";
import Server from "../models/serverInvite.js";

export const sendServerInvite = async (req, res) => {
  try {
    const { from, to, serverId } = req.body;

    const invite = new ServerInvite({ from, to, server: serverId });
    await invite.save();

    res.status(201).json(invite);
  } catch (err) {
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
