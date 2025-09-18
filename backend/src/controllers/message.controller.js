import Message from "../models/Message.js";
import Channel from "../models/Channel.js";
import { io } from "../index.js";

export const sendMessage = async (req, res) => {
  try {
    const { text, senderId, channelId } = req.body;

    // Log para verificar datos recibidos
    console.log("📝 Nuevo mensaje recibido:", { text, senderId, channelId });

    if (!text || !senderId || !channelId) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const message = new Message({ text, sender: senderId, channel: channelId });
    console.log("🔊 Emitiendo a canal:", channelId, message.text);

    await message.save();

    // Asociar al canal
    const channel = await Channel.findById(channelId);
    channel.messages.push(message._id);
    await channel.save();

    // Popular el autor para enviarlo completo al frontend
    await message.populate("sender", "username");

    // 🔥 Emitir solo al canal correspondiente
    io.to(channelId).emit("message", {
      _id: message._id,
      text: message.text,
      sender: message.sender,
      channel: channelId,
      createdAt: message.createdAt,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const messages = await Message.find({ channel: channelId }).populate("sender", "username");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
