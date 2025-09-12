import React from "react";
import { useSelector } from "react-redux";

export default function ChatMessages() {
  const messages = useSelector((state) => state.messages.items);

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className="message">
          <p>{msg.text}</p>
          <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
        </div>
      ))}
    </div>
  );
}
