import React, { useState } from "react";
import { useSelector } from "react-redux";
import { sendMessage } from "../messages/message.service";

export default function ChatInput({ channelId }) {
  const [text, setText] = useState("");
  const { user } = useSelector((state) => state.auth);

  const handleSend = async (e) => {
    e.preventDefault();
    if (text.trim() === "" || !channelId) return;

    try {
      // Enviar mensaje al backend
      await sendMessage({
        text,
        senderId: user._id,
        channelId,
      });
      setText("");
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  return (
    <form className="message-input" onSubmit={handleSend}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
    </form>
  );
}
