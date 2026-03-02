"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Menu } from "@headlessui/react";
import {
  ChevronDown,
  Hash,
  Volume2,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Channel, Server } from "@/lib/definitions";
import { useServerPermissions } from "@/lib/useServerPermissions";
import { useServers } from "@/lib/context/ServersContext";
import CreateChannelModal from "./modals/CreateChannelModal";
import EditChannelModal from "./modals/EditChannelModal";
import DeleteChannelModal from "./modals/DeleteChannelModal";
import InviteFriendsModal from "@/ui/servers/modals/InviteFriendsModal";
import EditServerModal from "@/ui/servers/modals/EditServerModal";
import DeleteServerModal from "@/ui/servers/modals/DeleteServerModal";
import ManageRolesModal from "@/ui/servers/modals/ManageRolesModal";
import RenameServerModal from "@/ui/servers/modals/RenameServerModal";

export default function ChannelSidebar({
  sidebarControls,
}: {
  sidebarControls?: { closeSidebar?: () => void };
}) {
  const params = useParams();
  const effectiveServerId = params.serverId;
  const activeChannelId = params.channelId;

  const { servers, refreshServers } = useServers();

  const server = servers.find((s) => s.id === effectiveServerId);
  const channels = server?.channels ?? [];

  const [createType, setCreateType] = useState<"TEXT" | "VOICE">();
  const [channelToEdit, setChannelToEdit] = useState<Channel>();
  const [channelToDelete, setChannelToDelete] = useState<Channel>();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditServerModal, setShowEditServerModal] = useState(false);
  const [showDeleteServerModal, setShowDeleteServerModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showRenameServerModal, setShowRenameServerModal] = useState(false);

  const { hasPermission } = useServerPermissions(server);

  const hasAnyMenuPermission =
    hasPermission("INVITE_MEMBER") ||
    hasPermission("REMOVE_MEMBER") ||
    hasPermission("MANAGE_ROLES") ||
    hasPermission("RENAME_SERVER") ||
    hasPermission("DELETE_SERVER");

  const textChannels = channels.filter((channel) => channel.type === "TEXT");
  const voiceChannels = channels.filter((channel) => channel.type === "VOICE");

  const closeSidebar = sidebarControls?.closeSidebar;

  if (!effectiveServerId) {
    return (
      <aside className="flex h-full flex-col bg-sidebar p-4 text-sm text-text-secondary">
        <p>Selecciona un servidor para ver sus canales.</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="flex h-full flex-col bg-sidebar text-white">
        <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border px-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-semibold">
              {server?.name ?? "Servidor"}
            </h2>
          </div>
          {hasAnyMenuPermission && (
            <Menu as="div" className="relative">
              <Menu.Button className="rounded-md p-1.5 text-text-secondary transition hover:bg-surface hover:text-text-primary">
                <ChevronDown className="h-4 w-4" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 z-10 mt-2 w-44 rounded-md bg-surface text-sm shadow-lg ring-1 ring-black/20 focus:outline-none">
                {hasPermission("INVITE_MEMBER") && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(true)}
                        className={`block w-full px-3 py-2 text-left ${
                          active ? "bg-surface/80 text-white" : "text-text-secondary"
                        }`}
                      >
                        Invitar amigos
                      </button>
                    )}
                  </Menu.Item>
                )}
                {hasPermission("REMOVE_MEMBER") && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setShowEditServerModal(true)}
                        className={`block w-full px-3 py-2 text-left ${
                          active ? "bg-surface/80 text-white" : "text-text-secondary"
                        }`}
                      >
                        Eliminar miembros
                      </button>
                    )}
                  </Menu.Item>
                )}
                {hasPermission("MANAGE_ROLES") && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setShowRolesModal(true)}
                        className={`block w-full px-3 py-2 text-left ${
                          active ? "bg-surface/80 text-white" : "text-text-secondary"
                        }`}
                      >
                        Gestionar roles
                      </button>
                    )}
                  </Menu.Item>
                )}
                {hasPermission("RENAME_SERVER") && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setShowRenameServerModal(true)}
                        className={`block w-full px-3 py-2 text-left ${
                          active ? "bg-surface/80 text-white" : "text-text-secondary"
                        }`}
                      >
                        Cambiar nombre del servidor
                      </button>
                    )}
                  </Menu.Item>
                )}
                {hasPermission("DELETE_SERVER") && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setShowDeleteServerModal(true)}
                        className={`block w-full px-3 py-2 text-left ${
                          active ? "bg-ruby text-white" : "text-ruby"
                        }`}
                      >
                        Eliminar servidor
                      </button>
                    )}
                  </Menu.Item>
                )}
              </Menu.Items>
            </Menu>
          )}
          {closeSidebar && (
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-white md:hidden"
            >
              ✕
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-3">
          <ChannelSection
            title="Canales de texto"
            type="TEXT"
            channels={textChannels}
            serverId={effectiveServerId as string}
            activeChannelId={activeChannelId as string}
            onCreate={() => setCreateType("TEXT")}
            onEdit={setChannelToEdit}
            onDelete={setChannelToDelete}
            onNavigate={closeSidebar}
            canCreate={hasPermission("CREATE_CHANNEL")}
            canDelete={hasPermission("DELETE_CHANNEL")}
          />

          <ChannelSection
            title="Canales de voz"
            type="VOICE"
            channels={voiceChannels}
            serverId={effectiveServerId as string}
            activeChannelId={activeChannelId as string}
            onCreate={() => setCreateType("VOICE")}
            onEdit={setChannelToEdit}
            onDelete={setChannelToDelete}
            onNavigate={closeSidebar}
            canCreate={hasPermission("CREATE_CHANNEL")}
            canDelete={hasPermission("DELETE_CHANNEL")}
          />
        </div>
      </aside>

      {createType && (
        <CreateChannelModal
          serverId={effectiveServerId as string}
          defaultType={createType}
          onClose={() => setCreateType(undefined)}
          onCreated={() => refreshServers()}
        />
      )}

      {channelToEdit && (
        <EditChannelModal
          channel={channelToEdit}
          onClose={() => setChannelToEdit(undefined)}
          onUpdated={() => refreshServers()}
        />
      )}

      {channelToDelete && (
        <DeleteChannelModal
          channel={channelToDelete}
          onClose={() => setChannelToDelete(undefined)}
          onDeleted={() => refreshServers()}
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
          onMemberRemoved={() => refreshServers()}
        />
      )}

      {showDeleteServerModal && (
        <DeleteServerModal
          server={server as Server}
          onClose={() => setShowDeleteServerModal(false)}
          onDeleted={refreshServers}
        />
      )}

      {showRolesModal && (
        <ManageRolesModal
          server={server as Server}
          onClose={() => setShowRolesModal(false)}
        />
      )}

      {showRenameServerModal && (
        <RenameServerModal
          server={server as Server}
          onClose={() => setShowRenameServerModal(false)}
          onRenamed={refreshServers}
        />
      )}
    </>
  );
}

type SectionProps = {
  title: string;
  type: "TEXT" | "VOICE";
  channels: Channel[];
  serverId: string;
  activeChannelId: string;
  onCreate: () => void;
  onEdit: (channel: Channel) => void;
  onDelete: (channel: Channel) => void;
  onNavigate?: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
};

function ChannelSection({
  title,
  type,
  channels,
  serverId,
  activeChannelId,
  onCreate,
  onEdit,
  onDelete,
  onNavigate,
  canCreate,
  canDelete,
}: SectionProps) {
  const Icon = type === "TEXT" ? Hash : Volume2;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted">
        <span>{title}</span>
        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="rounded p-1 text-text-muted transition hover:text-gold"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <nav className="space-y-0.5 text-sm">
        {channels.map((channel) => {
          const channelId = channel.id;
          const href = `/servers/${serverId}/channels/${channelId}`;
          const isActive = activeChannelId === channelId;

          return (
            <div
              key={channelId}
              className={`group flex items-center justify-between rounded-md px-2 py-1.5 ${
                isActive
                  ? "bg-glass text-text-primary backdrop-blur-sm"
                  : "text-text-secondary hover:bg-surface/30 hover:text-text-primary"
              }`}
            >
              <Link
                href={href}
                onClick={onNavigate}
                className="flex flex-1 items-center gap-1.5 truncate"
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-gold" : "text-text-muted"}`} />
                <span className="truncate">{channel.name}</span>
              </Link>

              {canDelete && (
                <div className="ml-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(channel)}
                    className="rounded p-0.5 text-text-muted transition hover:text-text-primary"
                    aria-label="Editar canal"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(channel)}
                    className="rounded p-0.5 text-ruby/60 transition hover:text-ruby"
                    aria-label="Eliminar canal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {channels.length === 0 && (
          <p className="px-2 py-2 text-xs text-text-muted">Aún no hay canales.</p>
        )}
      </nav>
    </section>
  );
}
