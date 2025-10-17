// src/features/voice/VoiceControls.jsx
import React, { useState } from "react";
import { joinVoiceChannel, leaveVoiceChannel, muteMic, unmuteMic } from "../../services/voiceClient";

export default function VoiceControls({ channel, user }) {
  const [room, setRoom] = useState(null);
  const [muted, setMuted] = useState(false);

  const handleJoin = async () => {
    try {
      const r = await joinVoiceChannel(channel._id, user.username);
      setRoom(r);
    } catch (err) {
      console.error("❌ Error uniéndose al canal de voz:", err);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveVoiceChannel();
      setRoom(null);
      setMuted(false);
    } catch (err) {
      console.error("❌ Error saliendo del canal de voz:", err);
    }
  };

  const toggleMute = async () => {
    if (!room) return;
    if (muted) {
      await unmuteMic();
    } else {
      await muteMic();
    }
    setMuted(!muted);
  };

  return (
    <div className="voice-controls">
      {!room ? (
        <button onClick={handleJoin}>🎙️ Unirse a voz</button>
      ) : (
        <>
          <button onClick={handleLeave}>❌ Salir</button>
          <button onClick={toggleMute}>
            {muted ? "🎤 Activar micrófono" : "🔇 Mutear micrófono"}
          </button>
        </>
      )}
    </div>
  );
}
