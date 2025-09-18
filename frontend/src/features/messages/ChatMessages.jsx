import React from "react";
import useMessages from "./useMessages"; // Import the hook

export default function ChatMessages({ channelId }) {
  const messages = useMessages(channelId); // Use the hook

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg._id} className="message">
          <p>
            <strong>{msg.sender?.username || "?"}:</strong> {msg.text}
          </p>
          <small>
            {msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString()
              : ""}
          </small>
        </div>
      ))}
    </div>
  );
}
