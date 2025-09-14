import React, { useState } from "react";
//import { useDispatch } from "react-redux";
//import { addMessage } from "../reducers/addMessageReducer";
import socket from "../../services/socket";

export default function ChatInput() {
  const [text, setText] = useState("");
  //const dispatch = useDispatch();

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim() === "") return;

    const newMessage = {
      id: Date.now(),
      text,
      sender: "me",
      timestamp: new Date().toISOString(),
    };

    socket.emit("message", newMessage);
    setText("");
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
