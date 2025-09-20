// src/features/voice/VoiceControls.jsx
import React, { useEffect, useState } from "react";
import "./VoiceControls.css"

export default function VoiceControls({ stream, onLeave }) {
  const [muted, setMuted] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const detectTalking = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setIsTalking(volume > 20); // umbral de voz
      requestAnimationFrame(detectTalking);
    };

    detectTalking();

    return () => {
      audioContext.close();
    };
  }, [stream]);

  const toggleMute = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => (track.enabled = muted));
    setMuted(!muted);
  };

  return (
    <div className="voice-controls">
      <button onClick={onLeave}>🚪 Salir</button>
      <button onClick={toggleMute}>{muted ? "🔇 Activar" : "🎤 Silenciar"}</button>
      <span className={`talk-indicator ${isTalking ? "active" : ""}`}>
        {isTalking ? "🟢 Hablando" : "⚪️ Silencio"}
      </span>
    </div>
  );
}
