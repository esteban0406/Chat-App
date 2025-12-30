"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { backendFetch } from "@/lib/backend-client";

import "@livekit/components-styles";
import "./voice-theme.css";

type VoiceRoomProps = {
  channelId: string;
  userId?: string;
  displayName?: string;
  /**
   * Allow opting into video in the future without touching the component again.
   */
  enableVideo?: boolean;
};

export default function VoiceRoom({
  channelId,
  userId,
  displayName,
  enableVideo = false,
}: VoiceRoomProps) {
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const roomName = useMemo(() => `channel-${channelId}`, [channelId]);
  const resolvedDisplayName = useMemo(
    () => displayName?.trim() || undefined,
    [displayName]
  );

  useEffect(() => {
    const controller = new AbortController();

    backendFetch("/api/voice/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: userId,
        room: roomName,
        name: resolvedDisplayName,
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch LiveKit token");
        }
        return res.json();
      })
      .then(({ token, url }) => {
        setToken(token);
        setServerUrl(url);
      })
      .catch((err) => {
        console.error("Error joining voice channel", err);
        setError("No se pudo conectar al canal de voz.");
      });
  }, [channelId, userId, resolvedDisplayName, roomName, retryKey]);

  function LocalParticipantNameSync({ name }: { name?: string }) {
    const room = useRoomContext();

    useEffect(() => {
      const trimmed = name?.trim();
      if (!room || !trimmed) return;

      const updateName = () => {
        const participant = room.localParticipant;
        if (!participant || participant.name === trimmed) return;
        participant.setName(trimmed).catch((err) => {
          console.warn(
            "No se pudo actualizar el nombre del participante:",
            err
          );
        });
      };

      if (room.state === "connected") {
        updateName();
      }

      room.on(RoomEvent.Connected, updateName);
      return () => {
        room.off(RoomEvent.Connected, updateName);
      };
    }, [room, name]);

    return null;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-red-300">
        <p>{error}</p>
        <button
          type="button"
          className="rounded bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
          onClick={() => {
            setRetryKey((prev) => prev + 1);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      data-lk-theme="chat-app"
      serverUrl={serverUrl}
      token={token}
      connect
      audio
      video={enableVideo}
    >
      <VideoConference />
      <LocalParticipantNameSync name={resolvedDisplayName} />
    </LiveKitRoom>
  );
}
