export default function registerChannelHandlers(io, socket) {
  socket.on("joinChannel", (channelId, ack) => {
    if (!channelId) {
      if (ack) ack(false);
      return;
    }

    socket.join(channelId);
    socket.data = socket.data || {};
    socket.data.channelId = channelId;

    if (ack) ack(true); // 👈 confirmación al cliente
  });

  socket.on("leaveChannel", (channelId, ack) => {
    if (channelId) {
      socket.leave(channelId);
    }

    if (socket.data) {
      delete socket.data.channelId;
    }

    if (ack) ack(true); // 👈 confirmación al cliente
  });
}
