"use client";

import { useCallback, useEffect, useState } from "react";
import { Message } from "@/lib/definitions";
import { socket } from "@/lib/socket";
import { backendFetch, unwrapList } from "@/lib/backend-client";

export function useMessages(channelId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError(null);
      try {
        const res = await backendFetch(`/api/messages/${channelId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("No se pudieron cargar los mensajes");
        }

        const body = await res.json();
        if (!cancelled) {
          const list = unwrapList<Message>(body, "messages");
          setMessages(list);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setMessages([]);
          setError("No se pudieron cargar los mensajes");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [channelId, refreshKey]);

  useEffect(() => {
    if (!channelId) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinChannel", channelId);

    const handleMessage = (message: Message) => {
      if (message.channel === channelId) {
        setMessages((msgs) => [...msgs, message]);
      }
    };

    socket.on("message", handleMessage);

    return () => {
      socket.emit("leaveChannel", channelId);
      socket.off("message", handleMessage);
    };
  }, [channelId]);

  return {
    messages,
    loading,
    error,
    refresh,
  };
}
