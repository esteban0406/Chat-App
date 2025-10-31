import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postMessage } from "./messagesSlice";
import { selectActiveChannel } from "../channels/channelSlice";

export default function ChatInput({ className = "" }) {
  const [text, setText] = useState("");
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const activeChannel = useSelector(selectActiveChannel);

  const handleSend = (e) => {
    e.preventDefault();
    const senderId = user?._id || user?.id;
    if (text.trim() === "" || !activeChannel?._id || !senderId) return;

    dispatch(
      postMessage({
        text,
        senderId,
        channelId: activeChannel._id,
      })
    );

    setText("");
  };

  return (
    <form
      onSubmit={handleSend}
      className={`flex h-full w-full items-center space-x-2 rounded-md bg-gray-800 px-3 py-2 ${className}`}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Enviar mensaje a #${activeChannel?.name || "canal"}`}
        className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-sm font-semibold transition"
      >
        Enviar
      </button>
    </form>
  );
}
