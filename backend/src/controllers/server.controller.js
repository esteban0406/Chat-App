import Server from "../models/Server.js";
import Channel from "../models/Channel.js";

export const createServer = async (req, res) => {
  try {
    const { name, description } = req.body;

    // 🔹 Validar campo obligatorio
    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    // 🔹 Sacar el owner del token
    const ownerId = req.user._id;

    // 🔹 Crear el servidor con el dueño como miembro inicial
    const server = new Server({
      name,
      description: description || "",
      owner: ownerId,
      members: [ownerId], // 👈 El dueño entra como miembro automáticamente
    });

    await server.save();

    // 🔹 Crear canal por defecto "general"
    const channel = new Channel({
      name: "general",
      type: "text",
      server: server._id,
    });

    await channel.save();

    // 🔹 Asociar canal al servidor
    server.channels.push(channel._id);
    await server.save();

    // 🔹 Devolver el servidor con su canal inicial
    res.status(201).json({
      ...server.toObject(),
      defaultChannel: channel,
    });
  } catch (err) {
    console.error("Error creando servidor:", err);
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
