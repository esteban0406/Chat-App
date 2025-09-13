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

    // 🔹 limpiar mensajes cuando cambias de canal
    dispatch(clearMessages());

    // 🔹 cargar mensajes históricos desde API
    const fetchMessages = async () => {
      try {
        const res = await getMessages(channelId);
        dispatch(setMessages(res.data));
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      }
    };
    fetchMessages();

    // 🔹 escuchar mensajes en tiempo real
    socket.on("message", (msg) => {
      if (msg.channel === channelId) {
        dispatch(addMessage(msg));
      }
    });

    // cleanup cuando se desmonta o cambia de canal
    return () => {
      socket.off("message");
    };
  }, [channelId, dispatch]);

  return messages;
}
