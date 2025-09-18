import React, { useState } from "react";
import { useSelector } from "react-redux";
import ChatMessages from "../messages/ChatMessages";
import ChatInput from "./ChatInput";
import Sidebar from "./Sidebar";
import UserMenu from "../user/UserMenu";

export default function ChatRoom() {
  const { user } = useSelector((state) => state.auth);
  const [channelId, setChannelId] = useState(null);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <Sidebar onSelectChannel={setChannelId} />
      </aside>

      {/* Main chat section */}
      <main className="chat-section">
        <header className="chat-header">
          <h2>
            Bienvenido {user?.username || "Invitado"}{" "}
            {channelId ? `(Canal: ${channelId})` : ""}
          </h2>
          <UserMenu />
        </header>

        {channelId ? (
          <>
            <ChatMessages channelId={channelId} />
            <ChatInput channelId={channelId} />
          </>
        ) : (
          <p style={{ padding: "20px" }}>
            Selecciona un canal para comenzar a chatear 💬
          </p>
        )}
      </main>
    </div>
  );
}
