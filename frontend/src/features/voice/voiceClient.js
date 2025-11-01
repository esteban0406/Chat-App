// src/services/voiceClient.js
import * as LiveKit from "livekit-client";
import { API } from "../../services/api";
import { addAudioEl, removeAudioEl } from "./voiceUI";
import store from "../../store";
import { setParticipants } from "../voice/voiceSlice";

let room = null;

export async function joinVoiceChannel(channelId, userId) {
  // Request LiveKit token from backend
  const res = await API.post("/voice/join", {
    identity: userId,
    room: `channel-${channelId}`,
  });

  const { token, url } = res.data;

  // Connect to LiveKit room
  room = new LiveKit.Room();
  await room.connect(url, token, { autoSubscribe: true });
  await room.localParticipant.setMicrophoneEnabled(true);

  console.log(`🎙️ Connected to voice channel ${channelId} as ${userId}`);

  // 🔁 Utility to push all participants (local + remote) to Redux
  const updateParticipants = () => {
    const allParticipants = [
      {
        id: room.localParticipant.identity,
        username: room.localParticipant.identity,
        isLocal: true,
        muted: !room.localParticipant.isMicrophoneEnabled,
      },
      ...Array.from(room.remoteParticipants.values()).map((p) => ({
        id: p.identity,
        username: p.identity,
        muted: !Array.from(p.trackPublications.values()).some(
          (pub) => pub.kind === "audio" && pub.isSubscribed
        ),
      })),
    ];

    store.dispatch(setParticipants(allParticipants));
    return allParticipants; // ✅ Return it so we can reuse the current list
  };

  // Initial state sync
  let currentParticipants = updateParticipants();

  // 🔔 Event listeners
  room
    .on(LiveKit.RoomEvent.Connected, () =>
      console.log("✅ Connected to LiveKit")
    )
    .on(LiveKit.RoomEvent.ParticipantConnected, (p) => {
      console.log(`🔵 User joined: ${p.identity}`);
      currentParticipants = updateParticipants();
    })
    .on(LiveKit.RoomEvent.ParticipantDisconnected, (p) => {
      console.log(`🔴 User left: ${p.identity}`);
      removeAudioEl(p.identity);
      currentParticipants = updateParticipants();
    })
    .on(LiveKit.RoomEvent.TrackSubscribed, (track, _, participant) => {
      if (track.kind === "audio") {
        addAudioEl(participant.identity, track.mediaStreamTrack);
      }
      currentParticipants = updateParticipants();
    })
    .on(LiveKit.RoomEvent.TrackUnsubscribed, (track, _, participant) => {
      if (track.kind === "audio") {
        removeAudioEl(participant.identity);
      }
      currentParticipants = updateParticipants();
    })
    .on(LiveKit.RoomEvent.TrackMuted, () => {
      currentParticipants = updateParticipants();
    })
    .on(LiveKit.RoomEvent.TrackUnmuted, () => {
      currentParticipants = updateParticipants();
    })
    .on(LiveKit.RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakerIds = speakers.map((s) => s.sid);
      // Use the last synced list to update speaking state
      const updated = currentParticipants.map((p) => ({
        ...p,
        speaking: speakerIds.includes(p.id),
      }));
      currentParticipants = updated;
      store.dispatch(setParticipants(updated));
    });

  return room;
}

export async function leaveVoiceChannel() {
  if (room) {
    await room.disconnect();
    store.dispatch(setParticipants([]));
    console.log("👋 Left voice channel");
    room = null;
  }
}

export async function setMic(enabled) {
  if (room) {
    await room.localParticipant.setMicrophoneEnabled(enabled);
    console.log(enabled ? "🎤 Mic on" : "🔇 Mic off");
  }
}
