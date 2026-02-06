"use client";

import { useState } from "react";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";
type Props = {
  channelId: string;
  disabled?: boolean;
  onError?: (error: string) => void;
};

export default function ChatInput({ channelId, disabled, onError }: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() || !channelId || sending) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await backendFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content,
          channelId,
        }),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo enviar el mensaje");
        throw new Error(msg);
      }

      setContent("");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje";
      setError(message);
      onError?.(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full items-center gap-2 rounded-md bg-gray-800 px-3"
    >
      <input
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={disabled || sending}
        className="flex-1 rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || sending}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {sending ? "Enviando..." : "Enviar"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}
