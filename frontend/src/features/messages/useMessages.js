import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, addMessage, clearMessages } from "./messagesSlice";
import { selectActiveChannel } from "../channels/channelSlice";
import socket from "../../services/socket";

export default function useMessages() {
  const dispatch = useDispatch();
  const activeChannel = useSelector(selectActiveChannel);
  const { items: messages, loading, error } = useSelector((state) => state.messages);

  useEffect(() => {
    if (!activeChannel?._id) return;

    dispatch(clearMessages());
    dispatch(fetchMessages(activeChannel._id)); 

    socket.emit("joinChannel", activeChannel._id);

    const handleMessage = (msg) => {
      if (msg.channel === activeChannel._id) {
        dispatch(addMessage(msg));
      }
    };

    socket.on("message", handleMessage);

    return () => {
      socket.emit("leaveChannel", activeChannel._id);
      socket.off("message", handleMessage);
    };
  }, [activeChannel?._id, dispatch]);

  return { messages, loading, error };
}
