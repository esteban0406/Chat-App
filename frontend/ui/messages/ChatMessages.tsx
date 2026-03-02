"use client";

import { Message } from "@/lib/definitions";
import { toBackendURL } from "@/lib/backend-client";
import UserAvatar from "@/ui/user/UserAvatar";

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
        const isOwn = message.authorId === currentUserId;

        return (
          <div key={message.id} className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
            <UserAvatar
              src={toBackendURL(`/api/users/${authorId}/avatar`)}
              username={authorName}
              userId={authorId}
              size={36}
              shape="rounded"
            />

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
