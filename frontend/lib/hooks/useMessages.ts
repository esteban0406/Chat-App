"use client";

import { useCallback, useEffect, useState } from "react";
import { Message } from "@/lib/definitions";
import { connectSocket } from "@/lib/socket";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

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
        const res = await backendFetch(`/api/messages/channel/${channelId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const msg = await extractErrorMessage(res, "No se pudieron cargar los mensajes");
          throw new Error(msg);
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
          const message = err instanceof Error ? err.message : "No se pudieron cargar los mensajes";
          setError(message);
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

    const socket = connectSocket();

    socket.emit("joinChannel", channelId);

    const handleMessage = (message: Message) => {
      if (message.channelId === channelId) {
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
