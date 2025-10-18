import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postMessage } from "./messagesSlice";
import { selectActiveChannel } from "../channels/channelSlice";

export default function ChatInput() {
  const [text, setText] = useState("");
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const activeChannel = useSelector(selectActiveChannel);

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim() === "" || !activeChannel?._id) return;

    dispatch(postMessage({
      text,
      senderId: user._id,
      channelId: activeChannel._id,
    }));

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
