"use client";

import { useState } from "react";
import { Message } from "@/app/lib/definitions";

type Props = {
  channelId: string;
  senderId?: string;
  disabled?: boolean;
  onSent?: (message: Message) => void;
  onError?: (error: string) => void;
};

export default function ChatInput({
  channelId,
  senderId,
  disabled,
  onSent,
  onError,
}: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !channelId || !senderId || sending) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          channelId,
          senderId,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo enviar el mensaje");
      }

      const data = await res.json();
      const message =
        data?.data?.message ?? data?.message ?? data;

      setText("");
      onSent?.(message);
    } catch (err) {
      console.error(err);
      const message = "No se pudo enviar el mensaje";
      setError(message);
      onError?.(message);
    } finally {
      setSending(false);
    }
  };

  const placeholder = senderId
    ? "Escribe un mensaje..."
    : "Inicia sesión para enviar mensajes";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center space-x-2 rounded-md bg-gray-800 px-3 py-3"
    >
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        disabled={!senderId || disabled || sending}
        className="flex-1 rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!senderId || disabled || sending}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {sending ? "Enviando..." : "Enviar"}
      </button>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </form>
  );
}
