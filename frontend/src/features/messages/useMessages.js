// src/features/messages/useMessages.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMessages } from "../../services/api";
import socket from "../../services/socket";
import { addMessage, setMessages, clearMessages } from "./messagesSlice";

export default function useMessages(channelId) {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages.items);

  useEffect(() => {
    if (!channelId) return;

    dispatch(clearMessages());

    const fetchMessages = async () => {
      try {
        const res = await getMessages(channelId);
        dispatch(setMessages(res.data));
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      }
    };
    fetchMessages();

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

  return messages;
}
