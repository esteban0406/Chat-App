import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ChatMessages from "../messages/ChatMessages";
import ChatInput from "../messages/ChatInput";
import Sidebar from "../sidebar/Sidebar";
import UserMenu from "../user/UserMenu";
import VoiceControls from "../voice/VoiceControls";
import { selectActiveChannel } from "../channels/channelSlice";
import "./chat.css";

export default function MainPage() {
  const { user } = useSelector((state) => state.auth);
  const activeChannel = useSelector(selectActiveChannel);
  const [stream, setStream] = useState(null);

  // 🔹 Capturar micrófono si es canal de voz
  useEffect(() => {
    const joinVoice = async () => {
      if (activeChannel?.type === "voice") {
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

    // cleanup al desmontar o al salir del canal
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeChannel]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <Sidebar /> {/* ✅ ya no pasamos onSelectChannel */}
      </aside>

      {/* Main chat section */}
      <main className="chat-section">
        <header className="chat-header">
          <h2>
            Bienvenido {user?.username || "Invitado"}{" "}
            {activeChannel?.name ? `(Canal: ${activeChannel.name})` : ""}
          </h2>
          <UserMenu />
        </header>

        {activeChannel ? (
          activeChannel.type === "voice" ? (
            <VoiceControls channel={activeChannel} user={user} />
          ) : (
            <>
              <ChatMessages channelId={activeChannel._id} />
              <ChatInput channelId={activeChannel._id} />
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
