"use client";

import { Message } from "@/lib/definitions";

type Props = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
};

const AVATAR_COLORS = [
  "bg-gold",
  "bg-ruby",
  "bg-[#4A90D9]",
  "bg-[#43B581]",
  "bg-[#B56AD8]",
  "bg-[#E67E22]",
];

function getAvatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ChatMessages({
  messages,
  loading,
  error,
  currentUserId,
}: Props) {
  if (loading) {
    return <p className="p-4 text-sm text-text-muted">Cargando mensajes...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-ruby">{error}</p>;
  }

  if (!messages.length) {
    return (
      <p className="p-4 text-sm text-text-muted">
        Aún no hay mensajes en este canal.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {messages.map((message) => {
        const authorName = message.author?.username ?? "Usuario";
        const authorId = message.authorId ?? "unknown";
        const avatarColor = getAvatarColor(authorId);
        const isOwn = message.authorId === currentUserId;

        return (
          <div key={message.id} className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold text-white ${avatarColor}`}
            >
              {authorName[0]?.toUpperCase() ?? "?"}
            </div>

            <div className={`min-w-0 flex-1 ${isOwn ? "flex flex-col items-end" : ""}`}>
              <div className={`flex items-baseline gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && (
                  <span className="text-sm font-semibold text-gold">
                    {authorName}
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleTimeString()
                    : ""}
                </span>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-text-body break-words">
                {message.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
