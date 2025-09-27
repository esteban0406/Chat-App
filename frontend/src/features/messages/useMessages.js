import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, addMessage, clearMessages } from "./messagesSlice";
import socket from "../../services/socket";

export default function useMessages(channelId) {
  const dispatch = useDispatch();
  const { items: messages, loading, error } = useSelector((state) => state.messages);

  useEffect(() => {
    if (!channelId) return;

    dispatch(clearMessages());
    dispatch(fetchMessages(channelId)); 

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
  }, [channelId, dispatch]);

  return { messages, loading, error };
}
