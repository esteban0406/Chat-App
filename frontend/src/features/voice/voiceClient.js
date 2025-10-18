// src/services/voiceClient.js
import * as LiveKit from "livekit-client";
import { API } from "../../services/api";
import { addAudioEl, removeAudioEl } from "./voiceUI";

let room = null;

export async function joinVoiceChannel(channelId, userId) {
  // Pedir token al backend
  const res = await API.post("/voice/join", {
    identity: userId,
    room: `channel-${channelId}`,
  });

  const { token, url } = res.data;

  // Crear sala y conectar
  room = new LiveKit.Room();
  await room.connect(url, token, { autoSubscribe: true });

  // Activar micrófono local
  await room.localParticipant.setMicrophoneEnabled(true);

  console.log(`🎙️ Conectado a canal de voz ${channelId} como ${userId}`);

  // Manejar participantes existentes
  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((pub) => {
      if (pub.track?.kind === "audio") {
        addAudioEl(participant.identity, pub.track.mediaStreamTrack);
      }
    });
  });

  // Eventos principales
  room
    .on(LiveKit.RoomEvent.Connected, () =>
      console.log("✅ Conectado a LiveKit")
    )
    .on(LiveKit.RoomEvent.Reconnecting, () =>
      console.warn("🔄 Reintentando conexión...")
    )
    .on(LiveKit.RoomEvent.Reconnected, () =>
      console.log("✅ Reconectado a LiveKit")
    )
    .on(LiveKit.RoomEvent.Disconnected, () =>
      console.error("❌ Desconectado de LiveKit")
    )
    .on(LiveKit.RoomEvent.TrackSubscribed, (track, _, participant) => {
      if (track.kind === "audio") {
        addAudioEl(participant.identity, track.mediaStreamTrack);
      }
    })
    .on(LiveKit.RoomEvent.TrackUnsubscribed, (track, _, participant) => {
      if (track.kind === "audio") {
        removeAudioEl(participant.identity);
      }
    })
    .on(LiveKit.RoomEvent.ParticipantConnected, (p) =>
      console.log(`🔵 Usuario conectado: ${p.identity}`)
    )
    .on(LiveKit.RoomEvent.ParticipantDisconnected, (p) => {
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

export async function setMic(enabled) {
  if (room) {
    await room.localParticipant.setMicrophoneEnabled(enabled);
    console.log(enabled ? "🎤 Micrófono activado" : "🔇 Micrófono muteado");
  }
}
