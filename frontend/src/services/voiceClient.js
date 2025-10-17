// src/services/voiceClient.js
import * as LiveKit from "livekit-client";
import { API } from "./api";
import { addAudioEl, removeAudioEl } from "./voiceUI";

let room = null;

export async function joinVoiceChannel(channelId, userId) {
  // 1️⃣ Pedir token al backend
  const res = await API.post("/voice/join", {
    identity: userId,
    room: `channel-${channelId}`,
  });

  const { token, url } = res.data;

  // 2️⃣ Crear sala LiveKit
  room = new LiveKit.Room();

  // Conectar (forzamos relay para evitar problemas de NAT)
  await room.connect(url, token, { 
    autoSubscribe: true,
    rtcConfig: { iceTransportPolicy: "relay" }
  });

  // Activar micrófono local (solo una vez al conectar)
  await room.localParticipant.setMicrophoneEnabled(true);

  console.log("🎙️ Conectado a sala de voz:", channelId);

  // 👉 Debug: mostrar tracks locales
  console.log("👉 Tracks locales del participante:", room.localParticipant.identity);
  room.localParticipant.tracks.forEach((pub, sid) => {
    console.log("   LocalTrack:", sid, pub.source, pub.track?.kind, "muted:", pub.isMuted);
  });

  // 3️⃣ Participantes actuales y sus tracks
  room.participants.forEach((participant) => {
    console.log(`👥 Ya estaba conectado: ${participant.identity}`);
    participant.tracks.forEach((pub, sid) => {
      console.log("   Track existente:", sid, pub.source, pub.track?.kind);
      if (pub.track && pub.track.kind === "audio") {
        addAudioEl(participant.identity, pub.track.mediaStreamTrack);
      }
    });
  });

  // --- Eventos Debug ---

  room.on(LiveKit.RoomEvent.Connected, () => {
    console.log("✅ RoomEvent.Connected");
  });

  room.on(LiveKit.RoomEvent.Reconnecting, () => {
    console.warn("🔄 Reintentando conexión con LiveKit...");
  });

  room.on(LiveKit.RoomEvent.Reconnected, () => {
    console.log("✅ Reconectado a LiveKit");
  });

  room.on(LiveKit.RoomEvent.Disconnected, () => {
    console.error("❌ Se perdió conexión con LiveKit");
  });

  // Publicaciones
  room.on(LiveKit.RoomEvent.TrackPublished, (pub, participant) => {
    console.log(`📡 ${participant.identity} publicó track`, pub.source, pub.kind);
  });

  room.on(LiveKit.RoomEvent.TrackUnpublished, (pub, participant) => {
    console.log(`🛑 ${participant.identity} dejó de publicar track`, pub.source, pub.kind);
  });

  // Suscripciones
  room.on(LiveKit.RoomEvent.TrackSubscribed, (track, pub, participant) => {
    console.log(`✅ TrackSubscribed: ${participant.identity}`, pub.source, pub.kind);
    if (track.kind === "audio") {
      addAudioEl(participant.identity, track.mediaStreamTrack);
    }
  });

  room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
    console.log(`❌ TrackUnsubscribed: ${participant.identity}`, pub.source, pub.kind);
    if (track.kind === "audio") {
      removeAudioEl(participant.identity);
    }
  });

  // Participantes
  room.on(LiveKit.RoomEvent.ParticipantConnected, (p) => {
    console.log(`🔵 Usuario conectado: ${p.identity}`);
  });

  room.on(LiveKit.RoomEvent.ParticipantDisconnected, (p) => {
    console.log(`🔴 Usuario desconectado: ${p.identity}`);
    removeAudioEl(p.identity);
  });

  return room;
}

// --- Utilidades ---

export async function leaveVoiceChannel() {
  if (room) {
    await room.disconnect();
    console.log("👋 Saliste del canal de voz");
    room = null;
  }
}

export async function muteMic() {
  if (room) {
    await room.localParticipant.setMicrophoneEnabled(false);
    console.log("🔇 Micrófono muteado");
  }
}

export async function unmuteMic() {
  if (room) {
    await room.localParticipant.setMicrophoneEnabled(true);
    console.log("🎤 Micrófono activado");
  }
}
