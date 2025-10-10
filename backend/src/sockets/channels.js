export default function registerChannelHandlers(io, socket) {
  socket.on("joinChannel", (channelId) => {
    if (!channelId) {
      return;
    }

    socket.join(channelId);
    socket.data = socket.data || {};
    socket.data.channelId = channelId;
  });

  socket.on("leaveChannel", (channelId) => {
    if (channelId) {
      socket.leave(channelId);
    }

    if (socket.data) {
      delete socket.data.channelId;
    }
  });
}
