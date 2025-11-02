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
  const updateParticipants = (prevParticipants = []) => {
    const getExisting = (identity) =>
      prevParticipants.find((p) => p.id === identity);

    const resolveLocalMute = () => {
      const micState = room.localParticipant?.isMicrophoneEnabled;
      if (typeof micState === "function") {
        return !micState.call(room.localParticipant);
      }
      return !(micState ?? true);
    };

    const resolveRemoteMute = (participant) => {
      const publications = Array.from(participant.trackPublications.values());
      if (publications.length === 0) {
        return true;
      }
      const hasActiveAudio = publications.some((pub) => {
        if (pub.kind !== "audio" || !pub.isSubscribed) return false;
        if (typeof pub.isMuted === "boolean") {
          return !pub.isMuted;
        }
        const track = pub.audioTrack || pub.track;
        if (!track) return false;
        if ("isMuted" in track) {
          return !track.isMuted;
        }
        const media = track.mediaStreamTrack;
        return !!media && media.enabled && !media.muted;
      });
      return !hasActiveAudio;
    };

    const allParticipants = [
      {
        id: room.localParticipant.identity,
        username: room.localParticipant.identity,
        isLocal: true,
        muted: resolveLocalMute(),
        speaking: getExisting(room.localParticipant.identity)?.speaking ?? false,
      },
      ...Array.from(room.remoteParticipants.values()).map((p) => ({
        id: p.identity,
        username: p.identity,
        muted: resolveRemoteMute(p),
        speaking: getExisting(p.identity)?.speaking ?? false,
      })),
    ];

    store.dispatch(setParticipants(allParticipants));
    return allParticipants; // ✅ Return it so we can reuse the current list
  };

  // Ensure we have audio elements for participants already in the room
  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((pub) => {
      if (
        pub.kind === "audio" &&
        pub.isSubscribed &&
        (pub.audioTrack || pub.track)?.mediaStreamTrack
      ) {
        addAudioEl(
          participant.identity,
          (pub.audioTrack || pub.track).mediaStreamTrack
        );
      }
    });
  });

  // Initial state sync
  let currentParticipants = updateParticipants();

  // 🔔 Event listeners
  room
    .on(LiveKit.RoomEvent.Connected, () =>
      console.log("✅ Connected to LiveKit")
    )
    .on(LiveKit.RoomEvent.ParticipantConnected, (p) => {
      console.log(`🔵 User joined: ${p.identity}`);
      currentParticipants = updateParticipants(currentParticipants);
    })
    .on(LiveKit.RoomEvent.ParticipantDisconnected, (p) => {
      console.log(`🔴 User left: ${p.identity}`);
      removeAudioEl(p.identity);
      currentParticipants = updateParticipants(currentParticipants);
    })
    .on(LiveKit.RoomEvent.TrackSubscribed, (track, _, participant) => {
      if (track.kind === "audio") {
        addAudioEl(participant.identity, track.mediaStreamTrack);
      }
      currentParticipants = updateParticipants(currentParticipants);
    })
    .on(LiveKit.RoomEvent.TrackUnsubscribed, (track, _, participant) => {
      if (track.kind === "audio") {
        removeAudioEl(participant.identity);
      }
      currentParticipants = updateParticipants(currentParticipants);
    })
    .on(LiveKit.RoomEvent.TrackMuted, () => {
      currentParticipants = updateParticipants(currentParticipants);
    })
    .on(LiveKit.RoomEvent.TrackUnmuted, () => {
      currentParticipants = updateParticipants(currentParticipants);
    })
    .on(LiveKit.RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakerIds = speakers.map((s) => s.identity);
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
