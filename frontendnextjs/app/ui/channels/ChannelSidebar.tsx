"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Channel, Server } from "@/app/lib/definitions";
import CreateChannelModal from "./modals/CreateChannelModal";
import EditChannelModal from "./modals/EditChannelModal";
import DeleteChannelModal from "./modals/DeleteChannelModal";

export default function ChannelSidebar({
  sidebarControls,
}: {
  sidebarControls?: { closeSidebar?: () => void };
}) {
  const params = useParams();
  const effectiveServerId = useMemo(() => {
    const raw = params?.serverId;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const activeChannelId = useMemo(() => {
    const raw = params?.channelId;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  const [createType, setCreateType] = useState<"text" | "voice" | null>(null);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

  useEffect(() => {
    if (!effectiveServerId) {
      setServer(null);
      return;
    }

    let cancelled = false;

    async function loadServer() {
      try {
        const res = await fetch("/api/servers", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("No se pudieron cargar los servidores");
        }
        const list = await res.json();
        if (cancelled) return;

        const found = Array.isArray(list)
          ? list.find(
              (server) =>
                (server as Server)?.id === effectiveServerId
            )
          : null;
        setServer(found ?? null);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setServer(null);
        }
      }
    }

    loadServer();
    return () => {
      cancelled = true;
    };
  }, [effectiveServerId]);

  useEffect(() => {
    if (!effectiveServerId) {
      setChannels([]);
      return;
    }

    let cancelled = false;

    async function loadChannels() {
      setLoadingChannels(true);
      setChannelsError(null);
      try {
        const res = await fetch(`/api/channels?serverId=${effectiveServerId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("No se pudieron cargar los canales");
        }
        const body = await res.json();
        if (cancelled) return;
        const parsed = Array.isArray(body)
          ? body
          : Array.isArray(body?.channels)
          ? body.channels
          : [];
        setChannels(parsed as Channel[]);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setChannels([]);
          setChannelsError("No se pudieron cargar los canales");
        }
      } finally {
        if (!cancelled) {
          setLoadingChannels(false);
        }
      }
    }

    loadChannels();
    return () => {
      cancelled = true;
    };
  }, [effectiveServerId, channelToEdit, createType]);

  const textChannels = channels.filter((channel) => channel.type === "text");
  const voiceChannels = channels.filter((channel) => channel.type === "voice");

  const closeSidebar = sidebarControls?.closeSidebar;

  const handleChannelCreated = (channel: Channel) => {
    setChannels((prev) => [...prev, channel]);
  };

  const handleChannelUpdated = (updated: Channel) => {
    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === updated.id ? updated : channel
      )
    );
  };

  const handleChannelDeleted = (channelId: string) => {
    setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
  };

  if (!effectiveServerId) {
    return (
      <aside className="flex h-full flex-col bg-gray-800 p-4 text-sm text-gray-400">
        <p>Selecciona un servidor para ver sus canales.</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="flex h-full flex-col bg-gray-800 p-3 text-white">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Servidor
            </p>
            <h2 className="text-lg font-semibold">
              {server?.name ?? "Servidor"}
            </h2>
          </div>
          {closeSidebar && (
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white md:hidden"
            >
              ✕
            </button>
          )}
        </header>

        {loadingChannels && (
          <p className="mb-2 text-sm text-gray-400">Cargando canales...</p>
        )}

        {channelsError && (
          <p className="mb-2 text-sm text-red-400">{channelsError}</p>
        )}

        <ChannelSection
          title="Canales de texto"
          prefix="#"
          channels={textChannels}
          serverId={effectiveServerId}
          activeChannelId={activeChannelId}
          onCreate={() => setCreateType("text")}
          onEdit={setChannelToEdit}
          onDelete={setChannelToDelete}
          onNavigate={closeSidebar}
        />

        <ChannelSection
          title="Canales de voz"
          prefix="🔊"
          channels={voiceChannels}
          serverId={effectiveServerId}
          activeChannelId={activeChannelId}
          onCreate={() => setCreateType("voice")}
          onEdit={setChannelToEdit}
          onDelete={setChannelToDelete}
          onNavigate={closeSidebar}
        />
      </aside>

      {createType && (
        <CreateChannelModal
          serverId={effectiveServerId}
          defaultType={createType}
          onClose={() => setCreateType(null)}
          onCreated={handleChannelCreated}
        />
      )}

      {channelToEdit && (
        <EditChannelModal
          channel={channelToEdit}
          onClose={() => setChannelToEdit(null)}
          onUpdated={handleChannelUpdated}
        />
      )}

      {channelToDelete && (
        <DeleteChannelModal
          channel={channelToDelete}
          onClose={() => setChannelToDelete(null)}
          onDeleted={handleChannelDeleted}
        />
      )}
    </>
  );
}

type SectionProps = {
  title: string;
  prefix: string;
  channels: Channel[];
  serverId: string;
  activeChannelId: string;
  onCreate: () => void;
  onEdit: (channel: Channel) => void;
  onDelete: (channel: Channel) => void;
  onNavigate?: () => void;
};

function ChannelSection({
  title,
  prefix,
  channels,
  serverId,
  activeChannelId,
  onCreate,
  onEdit,
  onDelete,
  onNavigate,
}: SectionProps) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
        <span>{title}</span>
        <button
          type="button"
          onClick={onCreate}
          className="rounded px-2 py-1 text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          +
        </button>
      </div>

      <nav className="space-y-1 text-sm">
        {channels.map((channel) => {
          const channelId = channel.id;
          const href = `/servers/${serverId}/channels/${channelId}`;
          const isActive = activeChannelId === channelId;

          return (
            <div
              key={channelId}
              className={`group flex items-center justify-between rounded px-3 py-2 ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <Link
                href={href}
                onClick={onNavigate}
                className="flex-1 truncate"
              >
                {prefix} {channel.name}
              </Link>

              <div className="ml-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(channel)}
                  className="rounded px-1 text-xs text-gray-400 hover:text-white"
                  aria-label="Editar canal"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(channel)}
                  className="rounded px-1 text-xs text-red-400 hover:text-red-300"
                  aria-label="Eliminar canal"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}

        {channels.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-500">Aún no hay canales.</p>
        )}
      </nav>
    </section>
  );
}
