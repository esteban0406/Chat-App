"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
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
      className="flex h-full w-full items-center gap-2"
    >
      <input
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={disabled}
        className="flex-1 rounded-lg bg-surface px-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="flex items-center justify-center rounded-lg bg-gold p-2 text-deep transition hover:bg-gold/90 disabled:opacity-60"
      >
        <SendHorizontal className="h-4 w-4" />
      </button>
      {error ? <span className="text-xs text-ruby">{error}</span> : null}
    </form>
  );
}
