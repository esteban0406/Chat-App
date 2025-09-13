import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatMessages from "../messages/ChatMessages";
import ChatInput from "./ChatInput";
import Sidebar from "./Sidebar";
import socket from "../../services/socket";
import { addMessage } from "../messages/messagesSlice";

export default function ChatRoom() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [channelId, setChannelId] = useState(null);

  useEffect(() => {
    socket.on("message", (msg) => {
      dispatch(addMessage(msg));
    });

    return () => {
      socket.off("message");
    };
  }, [dispatch]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <Sidebar onSelectChannel={setChannelId} />
      </aside>

      {/* Chat principal */}
      <main className="chat-section">
        <header className="chat-header">
          <h2>
            Bienvenido {user?.username || "Invitado"}{" "}
            {channelId ? `(Canal: ${channelId})` : ""}
          </h2>
        </header>

        {channelId ? (
          <>
            <ChatMessages channelId={channelId} />
            <ChatInput channelId={channelId} />
          </>
        ) : (
          <p style={{ padding: "20px" }}>Selecciona un canal para comenzar a chatear 💬</p>
        )}
      </main>
    </div>
  );
}
