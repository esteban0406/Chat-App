"use client";

import { useState } from "react";
import { connectSocket } from "@/lib/socket";

type Props = {
  channelId: string;
  senderId?: string;
  disabled?: boolean;
  onError?: (error: string) => void;
};

export default function ChatInput({ channelId, senderId, disabled, onError }: Props) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = content.trim();
    if (!text || !channelId || !senderId) {
      return;
    }

    setError(null);
    try {
      const socket = connectSocket();
      socket.emit("message", { channelId, senderId, text });
      setContent("");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje";
      setError(message);
      onError?.(message);
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
        disabled={disabled}
        className="flex-1 rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        Enviar
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}
