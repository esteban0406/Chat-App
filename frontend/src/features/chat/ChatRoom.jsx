// src/features/chat/ChatRoom.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import ChatMessages from "../messages/ChatMessages";
import ChatInput from "./ChatInput";
import Sidebar from "../sidebar/Sidebar";
import UserMenu from "../user/UserMenu";
import VoiceControls from "../voice/VoiceControls";
import "./chat.css";

export default function ChatRoom() {
  const { user } = useSelector((state) => state.auth);
  const [channel, setChannel] = useState(null);
  const [stream, setStream] = useState(null);

  // 🔹 Capturar micrófono si es canal de voz
  useEffect(() => {
    const joinVoice = async () => {
      if (channel?.type === "voice") {
        try {
          const userStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          setStream(userStream);
        } catch (err) {
          console.error("Error accediendo al micrófono:", err);
        }
      } else {
        // salir del canal de voz → detener tracks
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          setStream(null);
        }
      }
    };

    joinVoice();

    // cleanup al salir del canal
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [channel]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <Sidebar onSelectChannel={setChannel} />
      </aside>

      {/* Main chat section */}
      <main className="chat-section">
        <header className="chat-header">
          <h2>
            Bienvenido {user?.username || "Invitado"}{" "}
            {channel && channel.status !== "undenied" && channel.name
              ? `(Canal: ${channel.name})`
              : ""}
          </h2>
          <UserMenu />
        </header>

        {channel ? (
          channel.type === "voice" ? (
            <VoiceControls
              stream={stream}
              onLeave={() => {
                stream?.getTracks().forEach((track) => track.stop());
                setStream(null);
                setChannel(null);
              }}
            />
          ) : (
            <>
              <ChatMessages channelId={channel._id} />
              <ChatInput channelId={channel._id} />
            </>
          )
        ) : (
          <p style={{ padding: "20px" }}>
            Selecciona un canal para comenzar a chatear 💬
          </p>
        )}
      </main>
    </div>
  );
}
