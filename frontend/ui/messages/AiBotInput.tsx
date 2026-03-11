"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";

type Props = {
  onSend: (message: string) => Promise<void>;
  loading: boolean;
};

export default function AiBotInput({ onSend, loading }: Props) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || loading) return;
    setContent("");
    await onSend(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full items-center gap-2"
    >
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Pregúntale al asistente IA sobre Discol…"
        disabled={loading}
        data-tour="chat-input"
        className="flex-1 rounded-lg bg-surface px-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="flex items-center justify-center rounded-lg bg-gold p-2 text-deep transition hover:bg-gold/90 disabled:opacity-60"
      >
        <SendHorizontal className="h-4 w-4" />
      </button>
    </form>
  );
}
