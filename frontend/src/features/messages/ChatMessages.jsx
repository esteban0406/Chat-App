import React from "react";
import useMessages from "./useMessages"; 
import "./messages.css";

export default function ChatMessages({ channelId }) {
  const { messages, loading, error } = useMessages(channelId);

  if (loading) return <p>Cargando mensajes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

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

