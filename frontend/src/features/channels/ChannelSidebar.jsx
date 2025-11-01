import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Menu } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { selectServers } from "../servers/serverSlice";
import { selectLoadedServerIds } from "./channelSlice";
import { useChannels } from "./useChannels";

import InviteFriendsModal from "../servers/modals/InviteFriendsModal";
import EditServerModal from "../servers/modals/EditServerModal";
import DeleteServerModal from "../servers/modals/DeleteServerModal";
import CreateChannelModal from "./CreateChannelModal";
import EditChannelModal from "./EditChannelModal";
import DeleteChannelModal from "./DeleteChannelModal";
import {
  selectVoiceChannel,
  selectVoiceParticipants,
} from "../voice/voiceSlice";
import { Link } from "react-router-dom";

export default function ChannelSidebar({ serverId, sidebarControls = {} }) {
  const closeSidebar = sidebarControls.closeSidebar || (() => {});
  const servers = useSelector(selectServers);
  const loadedServerIds = useSelector(selectLoadedServerIds);
  const server = servers.find((s) => s._id === serverId);

  const {
    textChannels,
    voiceChannels,
    loadChannels,
    loading,
    // estados modales
    showInviteModal,
    showEditServerModal,
    showDeleteServerModal,
    showCreateChannelModal,
    channelTypeToCreate,
    channelToEdit,
    channelToDelete,
    // setters modales
    setShowInviteModal,
    setShowEditServerModal,
    setShowDeleteServerModal,
    setShowCreateChannelModal,
    setChannelToEdit,
    setChannelToDelete,
    // handlers
    openCreateChannelModal,
    handleEditChannel,
    handleDeleteChannel,
    handleOpenInviteModal,
    handleOpenEditServerModal,
    handleOpenDeleteServerModal,
  } = useChannels(serverId);

  useEffect(() => {
    if (serverId && !loadedServerIds.includes(serverId) && !loading) {
      loadChannels(serverId);
    }
  }, [serverId, loadedServerIds, loading, loadChannels]);

  if (!server) {
    return (
      <aside className="w-full bg-gray-800 p-3 flex flex-col">
        <h2 className="text-gray-400">Selecciona un servidor</h2>
      </aside>
    );
  }

  return (
    <aside className="flex w-full flex-col bg-gray-800 p-3">
      <ChannelSidebarHeader
        server={server}
        onInvite={handleOpenInviteModal}
        onEditServer={handleOpenEditServerModal}
        onDeleteServer={handleOpenDeleteServerModal}
        onCloseSidebar={closeSidebar}
      />

      <ChannelListSection
        className="mb-4"
        title="Canales de texto"
        prefix="#"
        channels={textChannels}
        serverId={serverId}
        onCreate={() => openCreateChannelModal("text")}
        onEditChannel={handleEditChannel}
        onDeleteChannel={handleDeleteChannel}
        onNavigate={closeSidebar}
      />

      <ChannelListSection
        title="Canales de voz"
        prefix="🔊"
        channels={voiceChannels}
        serverId={serverId}
        onCreate={() => openCreateChannelModal("voice")}
        onEditChannel={handleEditChannel}
        onDeleteChannel={handleDeleteChannel}
        onNavigate={closeSidebar}
      />

      {/* Modales */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}
      {showEditServerModal && (
        <EditServerModal
          server={server}
          onClose={() => setShowEditServerModal(false)}
        />
      )}
      {showDeleteServerModal && (
        <DeleteServerModal
          server={server}
          onClose={() => setShowDeleteServerModal(false)}
        />
      )}
      {showCreateChannelModal && (
        <CreateChannelModal
          serverId={serverId}
          defaultType={channelTypeToCreate}
          onClose={() => setShowCreateChannelModal(false)}
        />
      )}
      {channelToEdit && (
        <EditChannelModal
          channel={channelToEdit}
          onClose={() => setChannelToEdit(null)}
        />
      )}
      {channelToDelete && (
        <DeleteChannelModal
          channel={channelToDelete}
          onClose={() => setChannelToDelete(null)}
        />
      )}
    </aside>
  );
}

/* ===== Subcomponentes autocontenidos (opcional mover a archivos propios) ===== */

function ChannelSidebarHeader(props) {
  const { server, onInvite, onEditServer, onDeleteServer, onCloseSidebar } =
    props;
  return (
    <div className="relative mb-4 flex items-center justify-between">
      <h2 className="truncate text-lg font-semibold text-gray-200">
        {server.name}
      </h2>
      <div className="flex items-center gap-2">
        {onCloseSidebar && (
          <button
            type="button"
            onClick={onCloseSidebar}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
            aria-label="Cerrar canales"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        <Menu as="div" className="relative">
          <Menu.Button
            type="button"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-44 rounded bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <ActionMenuItem onClick={onInvite}>Invitar amigo</ActionMenuItem>
            <ActionMenuItem onClick={onEditServer}>
              Eliminar miembros
            </ActionMenuItem>
            <ActionMenuItem onClick={onDeleteServer} danger>
              Eliminar servidor
            </ActionMenuItem>
          </Menu.Items>
        </Menu>
      </div>
    </div>
  );
}

function ChannelListSection(props) {
  const {
    title,
    channels,
    prefix,
    onCreate,
    serverId,
    onEditChannel,
    onDeleteChannel,
    onNavigate,
    className = "",
  } = props;
  const safeChannels = channels ?? [];

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-2 text-gray-400 text-sm uppercase">
        <span className="truncate">{title}</span>
        <button
          onClick={onCreate}
          className="hover:text-white"
          aria-label="Crear canal"
        >
          ➕
        </button>
      </div>
      <nav className="space-y-2 mt-2">
        {safeChannels.map((channel) => (
          <ChannelRow
            key={channel._id}
            serverId={serverId}
            channel={channel}
            prefix={prefix}
            onNavigate={onNavigate}
            onEdit={() => onEditChannel(channel)}
            onDelete={() => onDeleteChannel(channel)}
          />
        ))}
      </nav>
    </div>
  );
}

function ChannelRow({
  channel,
  serverId,
  prefix,
  onEdit,
  onDelete,
  onNavigate,
}) {
  const currentChannelId = useSelector(selectVoiceChannel);
  const participants = useSelector(selectVoiceParticipants);
  const isActiveVoiceChannel = currentChannelId === channel._id;
  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <div className="group px-3 py-2 rounded-md hover:bg-gray-700 text-gray-200">
      <div className="flex items-center justify-between">
        <Link
          to={`/servers/${serverId}/channels/${channel._id}`}
          className="flex flex-1 items-center gap-2 truncate group-hover:text-white"
          onClick={handleNavigate}
        >
          <span>{prefix}</span>
          <span className="truncate">{channel.name}</span>
        </Link>

        <Menu as="div" className="relative ml-2">
          <Menu.Button
            type="button"
            className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity px-1"
          >
            ⚙
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-40 bg-gray-700 rounded shadow-lg z-20">
            <ActionMenuItem onClick={onEdit}>Editar canal</ActionMenuItem>
            <ActionMenuItem onClick={onDelete} danger>
              Eliminar canal
            </ActionMenuItem>
          </Menu.Items>
        </Menu>
      </div>

      {/* 👇 Active participants (only for the current voice channel) */}
      {isActiveVoiceChannel && participants.length > 0 && (
        <ul className="mt-1 ml-6 space-y-1">
          {participants.map((user) => (
            <li
              key={user.id}
              className={`flex items-center gap-2 text-sm text-gray-300 ${
                user.speaking ? "ring-2 ring-green-400 rounded-md" : ""
              }`}
            >
              <img
                src={
                  user.avatar ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt={user.username}
                className="w-5 h-5 rounded-full"
              />
              <span className="truncate">
                {user.isLocal ? `${user.username} (Tú)` : user.username}
              </span>
              {user.muted && <span className="text-gray-500 text-xs">🔇</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionMenuItem({ children, onClick, danger = false }) {
  const baseClasses =
    "block w-full text-left px-4 py-2 text-sm text-gray-200 transition-colors";
  const hoverClasses = danger ? "hover:bg-red-600" : "hover:bg-gray-600";

  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          onClick={onClick}
          className={`${baseClasses} ${hoverClasses} ${
            active ? (danger ? "bg-red-600" : "bg-gray-600") : ""
          }`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}
