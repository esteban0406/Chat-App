"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Channel, Server } from "@/lib/definitions";
import { backendFetch, unwrapList } from "@/lib/backend-client";
import CreateChannelModal from "./modals/CreateChannelModal";
import EditChannelModal from "./modals/EditChannelModal";
import DeleteChannelModal from "./modals/DeleteChannelModal";
import InviteFriendsModal from "@/ui/servers/modals/InviteFriendsModal";
import EditServerModal from "@/ui/servers/modals/EditServerModal";
import DeleteServerModal from "@/ui/servers/modals/DeleteServerModal";

export default function ChannelSidebar({
  sidebarControls,
}: {
  sidebarControls?: { closeSidebar?: () => void };
}) {
  const params = useParams();
  const effectiveServerId = params.serverId;
  const activeChannelId = params.channelId;

  const [server, setServer] = useState<Server>();
  const [channels, setChannels] = useState<Channel[]>([]);

  const [createType, setCreateType] = useState<"TEXT" | "VOICE">();
  const [channelToEdit, setChannelToEdit] = useState<Channel >();
  const [channelToDelete, setChannelToDelete] = useState<Channel >();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditServerModal, setShowEditServerModal] = useState(false);
  const [showDeleteServerModal, setShowDeleteServerModal] = useState(false);

  useEffect(() => {
    async function loadServer() {
      try {
        const res = await backendFetch("/api/servers", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("No se pudieron cargar los servidores");
        }
        const body = await res.json();
        const list = unwrapList<Server>(body, "servers");
        const found = list.find(
          (server: Server) => server.id === effectiveServerId
        );
        setServer(found);
      } catch (error) {
        console.error(error);
      }
    }
    loadServer();
  }, [effectiveServerId]);

  useEffect(() => {
    if (!effectiveServerId) {
      setChannels([]);
      return;
    }

    async function loadChannels() {
      try {
        const res = await backendFetch(
          `/api/channels/${effectiveServerId}`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok) {
          throw new Error("No se pudieron cargar los canales");
        }
        const body = await res.json();
        const list = unwrapList<Channel>(body, "channels");
        setChannels(list);
      } catch (error) {
        console.error(error);
      }
    }
    loadChannels();
  }, [effectiveServerId]);

  const textChannels = channels.filter((channel) => channel.type === "TEXT");
  const voiceChannels = channels.filter((channel) => channel.type === "VOICE");

  const closeSidebar = sidebarControls?.closeSidebar;

  const handleChannelCreated = (channel: Channel) => {
    setChannels((prev) => [...prev, channel]);
  };

  const handleChannelUpdated = (updated: Channel) => {
    setChannels((prev) =>
      prev.map((channel) => (channel.id === updated.id ? updated : channel))
    );
  };

  const handleChannelDeleted = (channelId: string) => {
    setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
  };

  const handleMemberRemoved = (memberId: string) => {
    setServer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members?.filter((member) => member.id !== memberId),
      };
    });
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
          <Menu as="div" className="relative">
            <Menu.Button className="rounded bg-gray-700 p-2 text-gray-200 hover:bg-gray-600">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-44 rounded bg-gray-700 text-sm shadow-lg ring-1 ring-black/20 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className={`block w-full px-3 py-2 text-left ${
                      active ? "bg-gray-600 text-white" : "text-gray-200"
                    }`}
                  >
                    Invitar amigos
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => setShowEditServerModal(true)}
                    className={`block w-full px-3 py-2 text-left ${
                      active ? "bg-gray-600 text-white" : "text-gray-200"
                    }`}
                  >
                    Gestionar miembros
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => setShowDeleteServerModal(true)}
                    className={`block w-full px-3 py-2 text-left ${
                      active ? "bg-red-600 text-white" : "text-red-300"
                    }`}
                  >
                    Eliminar servidor
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
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

        <ChannelSection
          title="Canales de texto"
          prefix="#"
          channels={textChannels}
          serverId={effectiveServerId as string}
          activeChannelId={activeChannelId as string}
          onCreate={() => setCreateType("TEXT")}
          onEdit={setChannelToEdit}
          onDelete={setChannelToDelete}
          onNavigate={closeSidebar}
        />

        <ChannelSection
          title="Canales de voz"
          prefix="🔊"
          channels={voiceChannels}
          serverId={effectiveServerId as string}
          activeChannelId={activeChannelId as string}
          onCreate={() => setCreateType("VOICE")}
          onEdit={setChannelToEdit}
          onDelete={setChannelToDelete}
          onNavigate={closeSidebar}
        />
      </aside>

      {createType && (
        <CreateChannelModal
          serverId={effectiveServerId as string}
          defaultType={createType}
          onClose={() => setCreateType(undefined)}
          onCreated={handleChannelCreated}
        />
      )}

      {channelToEdit && (
        <EditChannelModal
          channel={channelToEdit}
          onClose={() => setChannelToEdit(undefined)}
          onUpdated={handleChannelUpdated}
        />
      )}

      {channelToDelete && (
        <DeleteChannelModal
          channel={channelToDelete}
          onClose={() => setChannelToDelete(undefined)}
          onDeleted={handleChannelDeleted}
        />
      )}

      {showInviteModal && (
        <InviteFriendsModal
          server={server as Server}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showEditServerModal && (
        <EditServerModal
          server={server as Server}
          onClose={() => setShowEditServerModal(false)}
          onMemberRemoved={handleMemberRemoved}
        />
      )}

      {showDeleteServerModal && (
        <DeleteServerModal
          server={server as Server}
          onClose={() => setShowDeleteServerModal(false)}
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
