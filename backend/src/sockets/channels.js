export default function registerChannelHandlers(io, socket) {
  socket.on("joinChannel", (channelId) => {
    console.log(`📡 ${socket.id} joined channel: ${channelId}`);
    socket.join(channelId);
  });

  socket.on("leaveChannel", (channelId) => {
    console.log(`📡 ${socket.id} left channel: ${channelId}`);
    socket.leave(channelId);
  });
}
