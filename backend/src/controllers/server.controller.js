import Server from "../models/Server.js";
import Channel from "../models/Channel.js";

export const createServer = async (req, res) => {
  try {
    const { name, description, ownerId } = req.body;

    const server = new Server({ name, description, owner: ownerId, members: [ownerId] });
    await server.save();

    // Crear un canal por defecto "general"
    const channel = new Channel({ name: "general", type: "text", server: server._id });
    await channel.save();

    server.channels.push(channel._id);
    await server.save();

    res.status(201).json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const joinServer = async (req, res) => {
  try {
    const { serverId, userId } = req.body;
    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (!server.members.includes(userId)) {
      server.members.push(userId);
      await server.save();
    }

    res.json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getServers = async (req, res) => {
  try {
    const servers = await Server.find().populate("members", "username").populate("channels");
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
