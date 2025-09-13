import Channel from "../models/Channel.js";
import Server from "../models/Server.js";

export const createChannel = async (req, res) => {
  try {
    const { name, type, serverId } = req.body;

    const channel = new Channel({ name, type, server: serverId });
    await channel.save();

    const server = await Server.findById(serverId);
    server.channels.push(channel._id);
    await server.save();

    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const channels = await Channel.find({ server: serverId });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
