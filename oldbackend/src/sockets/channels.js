export default function registerChannelHandlers(io, socket) {
  socket.on("joinChannel", (channelId, ack) => {
    if (!channelId) {
      if (ack) ack(false);
      return;
    }

    socket.join(channelId);
    socket.data = socket.data || {};
    socket.data.channelId = channelId;

    if (ack) ack(true); 
  });

  socket.on("leaveChannel", async (channelId, ack) => {
    const activeChannel = socket.data?.channelId;
    const targetChannel = channelId || activeChannel;

    if (!targetChannel) {
      if (ack) ack(false);
      return;
    }

    try {
      await socket.leave(targetChannel);
    } catch (err) {
      if (ack) ack(false);
      return;
    }

    if (socket.data && socket.data.channelId === activeChannel) {
      delete socket.data.channelId;
    }

    if (ack) ack(true); 
  });
}
