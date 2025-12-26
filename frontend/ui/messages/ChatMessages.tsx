"use client";

import { Message } from "@/lib/definitions";

type Props = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
};

export default function ChatMessages({
  messages,
  loading,
  error,
  currentUserId,
}: Props) {
  if (loading) {
    return <p className="p-4 text-sm text-gray-400">Cargando mensajes...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-400">{error}</p>;
  }

  if (!messages.length) {
    return (
      <p className="p-4 text-sm text-gray-500">
        Aún no hay mensajes en este canal.
      </p>
    );
  }

  return (
    <div className="flex flex-col space-y-3 p-4">
      {console.log("ChatMessages render:", messages)}
      {messages.map((message) => {
        const senderId = message.sender.id;
        const isOwn = currentUserId && senderId === currentUserId;
        return (
          <div
            key={message.id}
            className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
              isOwn ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div
              className={`inline-block rounded-lg px-3 py-2 shadow-sm text-sm ${
                isOwn ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-100"
              }`}
            >
              {!isOwn && typeof message.sender === "object" && (
                <span className="font-semibold text-indigo-300 mr-1">
                  {message.sender?.username ?? "Usuario"}:
                </span>
              )}
              <span className="break-words">{message.text}</span>
            </div>
            <small className="mt-1 text-xs text-gray-400">
              {message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString()
                : ""}
            </small>
          </div>
        );
      })}
    </div>
  );
}
