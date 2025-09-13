import Message from "../models/Message.js";
import Channel from "../models/Channel.js";

export const sendMessage = async (req, res) => {
  try {
    const { text, senderId, channelId } = req.body;

    const message = new Message({ text, sender: senderId, channel: channelId });
    await message.save();

    // Asociar al canal
    const channel = await Channel.findById(channelId);
    channel.messages.push(message._id);
    await channel.save();

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
