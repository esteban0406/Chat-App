"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bars3Icon,
  HashtagIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ChatMessages from "@/ui/messages/ChatMessages";
import ChatInput from "@/ui/messages/ChatInput";
import { useMessages } from "@/ui/messages/useMessages";
import { authClient } from "@/lib/auth-client";
import { Channel, User } from "@/lib/definitions";
import { useLayoutContext } from "@/ui/layout/LayoutContext";
import VoiceRoom from "@/ui/voice/VoiceRoom";
import { backendFetch } from "@/lib/backend-client";

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
    authClient.getSession().then((session) => {
      setCurrentUser(session?.data?.user);
    });
  }, []);

  useEffect(() => {
    async function loadChannel() {
      try {
        const res = await backendFetch(`/api/channels?serverId=${serverId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("No se pudo cargar la información del canal");
        }
        const body = await res.json();
        const found = body.find((item: Channel) => item.id === channelId);
        setChannel(found ?? null);
      } catch (err) {
        console.error(err);
      }
    }

    loadChannel();
  }, [serverId, channelId]);

  const title = channel?.name
    ? `${channel.type === "voice" ? "🔊" : "#"} ${channel.name}`
    : `Canal ${channelId ?? ""}`;

  if (channel?.type === "voice") {
    return (
      <div className="flex h-full flex-col bg-gray-900">
        <VoiceRoom
          channelId={channelId ?? ""}
          userId={currentUser?.id}
          displayName={currentUser?.name}
          enableVideo={false}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openServerDrawer}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none md:hidden"
            aria-label="Abrir servidores"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={openSectionSidebar}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none"
            aria-label="Abrir canales"
          >
            <HashtagIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={openProfileDrawer}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none"
            aria-label="Abrir perfil"
          >
            <UserCircleIcon className="h-5 w-5" />
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

      <div className="flex h-[72px] items-center border-t border-gray-800 bg-gray-800 px-3">
        <ChatInput
          channelId={channelId ?? ""}
          senderId={currentUser?.id}
          onError={() => refresh()}
        />
      </div>
    </div>
  );
}
