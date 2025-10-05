export default function registerChannelHandlers(io, socket) {
  socket.on("joinChannel", (channelId) => {
    socket.join(channelId);
  });

  socket.on("leaveChannel", (channelId) => {
    socket.leave(channelId);
  });
}
