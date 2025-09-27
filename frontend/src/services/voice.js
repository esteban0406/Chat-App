import * as LiveKit from "livekit-client";
import {API} from "./api";

export async function joinVoiceChannel(channelId, userId) {
  // pedir token al backend
  const res = await API.post("/voice/join", {
    identity: userId,
    room: `channel-${channelId}`,
  });

  const { token, url } = res.data;

  console.log("🔗 Conectando a LiveKit:", url);
  console.log("🔑 Token recibido:", token);

  // 🔹 Crear sala y conectar
  const room = new LiveKit.Room();

  await room.connect(url, token, {
    autoSubscribe: true,
  });

  // 🔹 Publicar tu audio local
  await room.localParticipant.setMicrophoneEnabled(true);

  // 🔹 Manejar tracks remotos
  room.on(LiveKit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === "audio") {
      console.log(`🎧 Reproduciendo audio de ${participant.identity}`);
      const audioEl = document.createElement("audio");
      audioEl.srcObject = new MediaStream([track.mediaStreamTrack]);
      audioEl.autoplay = true;
      audioEl.play().catch((err) =>
        console.warn("⚠️ Error al reproducir audio remoto:", err)
      );
      document.body.appendChild(audioEl);
    }
  });

  // Opcional: cuando un track se desuscribe
  room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    console.log(`❌ Track eliminado de ${participant.identity}`);
    // podrías limpiar elementos de audio aquí si los montas en un contenedor
  });

  return room;
}
