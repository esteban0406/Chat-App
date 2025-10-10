import Message from "../models/Message.js";
import Channel from "../models/Channel.js";

// factory function that receives io
export function messageController(io) {
  return {
    sendMessage: async (req, res) => {
      try {
        const { text, senderId, channelId } = req.body;

        if (!text || !senderId || !channelId) {
          return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        const message = new Message({ text, sender: senderId, channel: channelId });
        await message.save();

        // Asociar al canal
        const channel = await Channel.findById(channelId);
        channel.messages.push(message._id);
        await channel.save();

        // Popular autor
        await message.populate("sender", "username");

        // Emitir solo al canal correspondiente
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
    },

    getMessages: async (req, res) => {
      try {
        const { channelId } = req.params;
        const messages = await Message.find({ channel: channelId }).populate("sender", "username");
        res.json(messages);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}
