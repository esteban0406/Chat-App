"use client";

import { Bot } from "lucide-react";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { toBackendURL } from "@/lib/backend-client";
import UserAvatar from "@/ui/user/UserAvatar";
import type { BotMessage } from "./useAiBot";

type Props = {
  messages: BotMessage[];
  loading: boolean;
  error: string | null;
};

export default function AiBotMessages({ messages, loading, error }: Props) {
  const { currentUser } = useCurrentUser();

  return (
    <div className="flex flex-col gap-5 p-4">
      {messages.map((msg) =>
        msg.role === "bot" ? (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-deep">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gold">
                  Asistente IA
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-text-body break-words">
                {msg.content}
              </p>
            </div>
          </div>
        ) : (
          <div key={msg.id} className="flex items-start gap-3 flex-row-reverse">
            <UserAvatar
              src={toBackendURL(`/api/users/${currentUser?.id ?? "unknown"}/avatar`)}
              username={currentUser?.username ?? "Tú"}
              userId={currentUser?.id ?? "unknown"}
              size={36}
              shape="rounded"
            />
            <div className="min-w-0 flex-1 flex flex-col items-end">
              <span className="text-xs text-text-muted">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
              <p className="mt-0.5 text-sm leading-relaxed text-text-body break-words">
                {msg.content}
              </p>
            </div>
          </div>
        ),
      )}

      {loading ? (
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-deep">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-gold">Asistente IA</span>
            <p className="mt-0.5 text-sm text-text-muted animate-pulse">
              Escribiendo…
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-ruby px-1">{error}</p>
      ) : null}
    </div>
  );
}
