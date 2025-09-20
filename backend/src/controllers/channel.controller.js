import Channel from "../models/Channel.js";
import Server from "../models/Server.js";

// 📌 Crear canal
export const createChannel = async (req, res) => {
  try {
    const { name, type, serverId } = req.body;
    const userId = req.user._id; // ✅ viene del authMiddleware

    if (!name || !serverId) {
      return res.status(400).json({ error: "El nombre y el serverId son requeridos" });
    }

    // Verificar que el servidor exista
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    // ✅ Verificar que el usuario sea miembro del servidor
    if (!server.members.includes(userId)) {
      return res.status(403).json({ error: "No eres miembro de este servidor" });
    }

    // Crear canal
    const channel = new Channel({
      name,
      type: type || "text",
      server: serverId,
    });
    await channel.save();

    // Asociar canal al servidor
    server.channels.push(channel._id);
    await server.save();

    res.status(201).json(channel);
  } catch (err) {
    console.error("Error creando canal:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Obtener canales de un servidor
export const getChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId).populate("channels");
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    // ✅ Verificar que el usuario sea miembro del servidor
    if (!server.members.includes(userId)) {
      return res.status(403).json({ error: "No eres miembro de este servidor" });
    }

    res.json(server.channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: "Canal no encontrado" });
    }

    // Eliminar referencia del servidor
    await Server.findByIdAndUpdate(channel.server, {
      $pull: { channels: channelId }
    });

    await Channel.findByIdAndDelete(channelId);

    res.json({ message: "Canal eliminado correctamente", channelId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};