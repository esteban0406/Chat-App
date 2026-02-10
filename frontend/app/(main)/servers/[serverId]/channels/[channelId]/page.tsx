"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Menu,
  Hash,
  Volume2,
  CircleUser,
} from "lucide-react";
import ChatMessages from "@/ui/messages/ChatMessages";
import ChatInput from "@/ui/messages/ChatInput";
import { useMessages } from "@/ui/messages/useMessages";
import { getMe, User } from "@/lib/auth";
import { Channel } from "@/lib/definitions";
import { useLayoutContext } from "@/ui/layout/LayoutContext";
import VoiceRoom from "@/ui/voice/VoiceRoom";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

export default function ChannelPage() {
  const params = useParams();
  const serverId = useMemo(() => {
    const raw = params?.serverId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const channelId = useMemo(() => {
    const raw = params?.channelId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { openServerDrawer, openSectionSidebar, openProfileDrawer } =
    useLayoutContext();

  const [channel, setChannel] = useState<Channel>();
  const [currentUser, setCurrentUser] = useState<User>();

  const { messages, loading, error, refresh } = useMessages(channelId);

  useEffect(() => {
    getMe().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  useEffect(() => {
    async function loadChannel() {
      try {
        const res = await backendFetch(`/api/servers/${serverId}/channels`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = await extractErrorMessage(res, "No se pudo cargar la información del canal");
          throw new Error(msg);
        }
        const body = await res.json();
        const list = unwrapList<Channel>(body, "channels");
        const found = list.find((item: Channel) => item.id === channelId);
        setChannel(found);
      } catch (err) {
        console.error(err);
      }
    }

    loadChannel();
  }, [serverId, channelId]);

  const ChannelIcon = channel?.type === "VOICE" ? Volume2 : Hash;

  if (channel?.type === "VOICE") {
    return (
      <div className="flex h-full flex-col bg-main">
        <VoiceRoom
          channelId={channelId ?? ""}
          userId={currentUser?.id}
          displayName={currentUser?.username}
          enableVideo={false}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-main">
      <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openServerDrawer}
            className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-text-primary focus:outline-none md:hidden"
            aria-label="Abrir servidores"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <ChannelIcon className="h-4 w-4 text-text-secondary" />
            {channel?.name ?? `Canal ${channelId ?? ""}`}
          </h2>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={openSectionSidebar}
            className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-text-primary focus:outline-none"
            aria-label="Abrir canales"
          >
            <Hash className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={openProfileDrawer}
            className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-text-primary focus:outline-none"
            aria-label="Abrir perfil"
          >
            <CircleUser className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <ChatMessages
          messages={messages}
          loading={loading}
          error={error}
          currentUserId={currentUser?.id}
        />
      </main>

      <div className="flex h-[var(--footer-height)] items-center px-3">
        <ChatInput
          channelId={channelId ?? ""}
          senderId={currentUser?.id}
          onError={() => refresh()}
        />
      </div>
    </div>
  );
}
