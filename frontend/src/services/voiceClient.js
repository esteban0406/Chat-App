// src/services/voiceClient.js
import * as LiveKit from "livekit-client";
import { API } from "./api";
import { addAudioEl, removeAudioEl } from "./voiceUI";

let room = null;

export async function joinVoiceChannel(channelId, userId) {
  // Pedir token al backend
  const res = await API.post("/voice/join", {
    identity: userId,
    room: `channel-${channelId}`,
  });

  const { token, url } = res.data;

  room = new LiveKit.Room();

  await room.connect(url, token, { autoSubscribe: true });
  await room.localParticipant.setMicrophoneEnabled(true);

  console.log("🎙️ Conectado a sala de voz:", channelId);

  // ✅ Esperar a que se complete la conexión antes de recorrer participants
  room.on(LiveKit.RoomEvent.Connected, () => {
    console.log("✅ RoomEvent.Connected");
    room.participants.forEach((participant) => {
      participant.tracks.forEach((publication) => {
        if (publication.track && publication.track.kind === "audio") {
          console.log(`🎧 Audio existente de ${participant.identity}`);
          addAudioEl(participant.identity, publication.track.mediaStreamTrack);
        }
      });
    });
  });

  // Tracks nuevos
  room.on(LiveKit.RoomEvent.TrackSubscribed, (track, pub, participant) => {
    if (track.kind === "audio") {
      console.log(`✅ TrackSubscribed: ${participant.identity}`);
      addAudioEl(participant.identity, track.mediaStreamTrack);
    }
  });

  // Tracks eliminados
  room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, pub, participant) => {
    if (track.kind === "audio") {
      console.log(`❌ TrackUnsubscribed: ${participant.identity}`);
      removeAudioEl(participant.identity);
    }
  });

  // Participantes entrando y saliendo
  room.on(LiveKit.RoomEvent.ParticipantConnected, (p) => {
    console.log(`🔵 Usuario conectado: ${p.identity}`);
  });

  room.on(LiveKit.RoomEvent.ParticipantDisconnected, (p) => {
    console.log(`🔴 Usuario desconectado: ${p.identity}`);
    removeAudioEl(p.identity);
  });

  return room;
}


// 7️⃣ Funciones utilitarias
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
