import * as LiveKit from "livekit-client";
import API from "./api";

export async function joinVoiceChannel(channelId, userId) {
  // pedir token al backend
  const res = await API.post("/voice/join", {
    identity: userId,
    room: `channel-${channelId}`,
  });

  const { token, url } = res.data;

  console.log("🔗 Conectando a LiveKit:", url);
  console.log("🔑 Token recibido:", token);


  // 🔹 Crear una nueva sala y conectar
  const room = new LiveKit.Room();

  await room.connect(url, token, {
    autoSubscribe: true,
  });

  // 🔹 Publicar tu audio local
  await room.localParticipant.setMicrophoneEnabled(true);

  return room;
}
