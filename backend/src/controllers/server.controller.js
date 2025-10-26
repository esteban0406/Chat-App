import Server from "../models/Server.js";
import Channel from "../models/Channel.js";

// ==================================================
// Crear servidor con canal por defecto
// ==================================================
export const createServer = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    const ownerId = req.user._id; // 👈 mantener ObjectId, no string

    const server = new Server({
      name,
      description: description || "",
      owner: ownerId,
      members: [ownerId],
    });

    await server.save();

    // canal por defecto
    const channel = new Channel({
      name: "general",
      type: "text",
      server: server._id,
    });
    await channel.save();

    server.channels.push(channel._id);
    await server.save();

    res.status(201).json({
      ...server.toObject(),
      defaultChannel: channel,
    });
  } catch (err) {
    console.error("❌ Error creando servidor:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ==================================================
// Unirse a un servidor
// ==================================================
export const joinServer = async (req, res) => {
  try {
    const { serverId, userId } = req.body;

    if (!serverId || !userId) {
      return res.status(400).json({ error: "serverId y userId requeridos" });
    }

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ error: "Servidor no encontrado" });

    const normalizedUserId = userId.toString();
    const alreadyMember = server.members.some(
      (m) => m.toString() === normalizedUserId
    );

    if (!alreadyMember) {
      server.members.push(normalizedUserId);
      await server.save();
    }

    res.json({
      ...server.toObject(),
      members: server.members.map((m) => m.toString()),
    });
  } catch (err) {
    console.error("❌ Error al unirse al servidor:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ==================================================
// Obtener servidores donde es miembro
// ==================================================
export const getServers = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const servers = await Server.find({ members: userId }).populate("channels");

    res.json(
      servers.map((s) => ({
        ...s.toObject(),
        members: s.members.map((m) => m.toString()),
        owner: s.owner.toString(),
      }))
    );
  } catch (err) {
    console.error("❌ Error obteniendo servidores:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ==================================================
// Eliminar un servidor
// ==================================================
export const deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;

    if (!serverId) {
      return res.status(400).json({ error: "Se requiere el serverId" });
    }

    await Channel.deleteMany({ server: serverId });
    await Server.findByIdAndDelete(serverId);

    res.json({ message: "Servidor eliminado con éxito" });
  } catch (err) {
    console.error("❌ Error eliminando servidor:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ==================================================
// Eliminar miembro (solo dueño)
// ==================================================
export const removeMember = async (req, res) => {
  try {
    const { serverId, memberId } = req.params;

    if (!serverId || !memberId) {
      return res.status(400).json({ error: "serverId y memberId requeridos" });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    if (server.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Solo el dueño puede eliminar miembros" });
    }

    const isMember = server.members.some(
      (m) => m.toString() === memberId.toString()
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ error: "El miembro no pertenece al servidor" });
    }

    server.members = server.members.filter(
      (m) => m.toString() !== memberId.toString()
    );
    await server.save();

    res.json({
      ...server.toObject(),
      members: server.members.map((m) => m.toString()),
    });
  } catch (err) {
    console.error("❌ Error eliminando miembro:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ==================================================
// Abandonar un servidor
// ==================================================
export const leaveServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id.toString();

    if (!serverId) {
      return res.status(400).json({ error: "Se requiere el serverId" });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    if (server.owner.toString() === userId) {
      return res
        .status(400)
        .json({ error: "El dueño no puede abandonar su servidor" });
    }

    const isMember = server.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(400).json({ error: "No perteneces a este servidor" });
    }

    server.members = server.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    await server.save();

    res.json({ message: "Has salido del servidor" });
  } catch (err) {
    console.error("❌ Error al salir del servidor:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
