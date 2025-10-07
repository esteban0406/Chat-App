import Server from "../models/Server.js";
import Channel from "../models/Channel.js";

export const createServer = async (req, res) => {
  try {
    const { name, description } = req.body;

    // 🔹 Validar campo obligatorio
    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    const ownerId = req.user._id;

    // 🔹 Crear el servidor con el dueño como miembro inicial
    const server = new Server({
      name,
      description: description || "",
      owner: ownerId,
      members: [ownerId], 
    });

    await server.save();

    const channel = new Channel({
      name: "general",
      type: "text",
      server: server._id,
    });

    await channel.save();

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
    const userId = req.user._id; // viene del authMiddleware
    const servers = await Server.find({ members: userId })
      .populate("members", "username")
      .populate("channels");

    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;

    if (!serverId) {
      return res.status(400).json({ error: "Se requiere el serverId" });
    }

    // Eliminar todos los canales asociados
    await Channel.deleteMany({ server: serverId });

    // Eliminar el servidor
    await Server.findByIdAndDelete(serverId);

    res.json({ message: "Servidor eliminado con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { serverId, memberId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    if (req.user._id.toString() !== server.owner.toString()) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar miembros" });
    }

    if (!server.members.includes(memberId)) {
      return res
        .status(400)
        .json({ error: "El miembro no pertenece al servidor" });
    }

    // Eliminar al miembro
    server.members = server.members.filter(
      (m) => m.toString() !== memberId
    );

    await server.save();

    const updatedServer = await Server.findById(serverId)
      .populate("members", "username")
      .populate("channels");

    res.json(updatedServer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const leaveServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    if (!serverId) {
      return res.status(400).json({ error: "Se requiere el serverId" });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    server.members = server.members.filter(member => member.toString() !== userId);
    await server.save();
    res.json({ message: "Has salido del servidor" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
