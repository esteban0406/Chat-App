import Message from "../models/Message.js";

export default function registerChatHandlers(io, socket) {
  // Listen for chat messages
  socket.on("message", async (data) => {

    try {
      const msg = new Message(data);
      await msg.save();

      // Broadcast message to all clients
      io.emit("message", msg);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });
}
