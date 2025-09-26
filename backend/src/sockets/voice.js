export default function registerVoiceHandlers(io, socket) {
  socket.on("joinVoice", (channelId) => {
    console.log(`🎤 ${socket.id} joined voice channel: ${channelId}`);
    socket.join(channelId);
  });

  socket.on("leaveVoice", (channelId) => {
    console.log(`🎤 ${socket.id} left voice channel: ${channelId}`);
    socket.leave(channelId);
  });

  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("candidate", ({ to, candidate }) => {
    io.to(to).emit("candidate", { from: socket.id, candidate });
  });
}
