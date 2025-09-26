import React, { useState } from "react";
import { joinVoiceChannel } from "../../services/voice";

export default function VoiceControls({ channel, user }) {
  const [room, setRoom] = useState(null);
  const [muted, setMuted] = useState(false);

  const handleJoin = async () => {
    try {
      const r = await joinVoiceChannel(channel._id, user.username);
      setRoom(r);
    } catch (err) {
      console.error("Error uniéndose al canal de voz:", err);
    }
  };

  const handleLeave = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
  };

  const toggleMute = () => {
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      if (pub.track) {
        pub.track.muted = !muted;
      }
    });
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
            {muted ? "🔇 Mutear" : "🎤 Desmutear"}
          </button>
        </>
      )}
    </div>
  );
}
