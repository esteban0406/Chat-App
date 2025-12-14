"use client";

import { useCallback, useEffect, useState } from "react";
import { Message } from "@/app/lib/definitions";

export function useMessages(channelId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        const res = await fetch(`/api/messages/${channelId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("No se pudieron cargar los mensajes");
        }

        const body = await res.json();
        if (!cancelled) {
          const list = Array.isArray(body)
            ? body
            : Array.isArray(body?.data?.messages)
            ? body.data.messages
            : Array.isArray(body?.messages)
            ? body.messages
            : [];
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

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    loading,
    error,
    refresh,
    appendMessage,
  };
}
