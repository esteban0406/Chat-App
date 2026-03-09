"use client";

import { useCallback, useState } from "react";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

export type BotMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  createdAt: string;
};

export function useAiBot() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(true);
    setError(null);

    try {
      const res = await backendFetch("/api/ai-bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(
          res,
          "Error al conectar con el asistente IA",
        );
        throw new Error(msg);
      }

      const { reply } = (await res.json()) as { reply: string };

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al conectar con el asistente IA",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, error, sendMessage };
}
