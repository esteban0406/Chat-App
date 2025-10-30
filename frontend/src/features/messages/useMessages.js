import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, addMessage, clearMessages } from "./messagesSlice";
import { selectActiveChannel } from "../channels/channelSlice";
import socket from "../../services/socket";

export default function useMessages(channelId) {
  const dispatch = useDispatch();
  const activeChannel = useSelector(selectActiveChannel);
  const { items: messages, loading, error, currentChannelId } = useSelector(
    (state) => state.messages
  );
  const activeChannelId = activeChannel?._id;

  useEffect(() => {
    if (!channelId || activeChannelId !== channelId) {
      return;
    }

    if (currentChannelId !== channelId) {
      dispatch(clearMessages());
      dispatch(fetchMessages(channelId));
    }

    socket.emit("joinChannel", channelId);

    const handleMessage = (msg) => {
      if (msg.channel === channelId) {
        dispatch(addMessage(msg));
      }
    };

    socket.on("message", handleMessage);

    return () => {
      socket.emit("leaveChannel", channelId);
      socket.off("message", handleMessage);
    };
  }, [channelId, activeChannelId, currentChannelId, dispatch]);

  return { messages, loading, error };
}
