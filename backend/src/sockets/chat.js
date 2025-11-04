import Message from "../services/message/Message.model.js";

export default function registerChatHandlers(io, socket) {
  socket.on("message", async (data) => {
    try {
      const incoming = data || {};
      const text = incoming.text;
      const resolvedChannel =
        incoming.channel || socket.data?.channelId || incoming.channelId;
      const resolvedSender =
        incoming.sender || socket.data?.userId || incoming.senderId;

      if (!resolvedChannel || !resolvedSender || !text) {
        console.warn("⚠️  Ignoring chat message with missing fields", {
          channel: resolvedChannel,
          sender: resolvedSender,
          text,
        });
        return;
      }

      const baseMessage = {
        ...incoming,
        channel: resolvedChannel,
        sender: resolvedSender,
      };

      if (process.env.DISABLE_DB_WRITE === "true") {
        const now = new Date();
        const fakeMsg = {
          _id:
            baseMessage._id ||
            `stress-${now.getTime().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
          createdAt: baseMessage.createdAt || now,
          updatedAt: baseMessage.updatedAt || now,
          ...baseMessage,
        };

        io.emit("message", fakeMsg);
        return;
      }

      const msg = new Message(baseMessage);
      await msg.save();

      io.emit("message", msg);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });
}
