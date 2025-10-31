import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Menu } from "@headlessui/react";

import { selectServers } from "../servers/serverSlice";
import { selectLoadedServerIds } from "./channelSlice";
import { useChannels } from "./useChannels";

import InviteFriendsModal from "../servers/modals/InviteFriendsModal";
import EditServerModal from "../servers/modals/EditServerModal";
import DeleteServerModal from "../servers/modals/DeleteServerModal";
import CreateChannelModal from "./CreateChannelModal";
import EditChannelModal from "./EditChannelModal";
import DeleteChannelModal from "./DeleteChannelModal";
import { Link } from "react-router-dom";

export default function ChannelSidebar({ serverId }) {
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
  } = useChannels();

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
    <aside className="w-full bg-gray-800 p-3 flex flex-col">
      <ChannelSidebarHeader
        server={server}
        onInvite={handleOpenInviteModal}
        onEditServer={handleOpenEditServerModal}
        onDeleteServer={handleOpenDeleteServerModal}
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
      />

      <ChannelListSection
        title="Canales de voz"
        prefix="🔊"
        channels={voiceChannels}
        serverId={serverId}
        onCreate={() => openCreateChannelModal("voice")}
        onEditChannel={handleEditChannel}
        onDeleteChannel={handleDeleteChannel}
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

function ChannelSidebarHeader({ server, onInvite, onEditServer, onDeleteServer }) {
  return (
    <div className="flex items-center justify-between mb-4 relative">
      <h2 className="text-gray-200 font-semibold truncate">{server.name}</h2>
      <Menu as="div" className="relative">
        <Menu.Button type="button" className="text-gray-400 hover:text-white px-2">
          ⋮
        </Menu.Button>
        <Menu.Items className="absolute right-0 mt-2 w-44 bg-gray-700 rounded shadow-lg z-10 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <ActionMenuItem onClick={onInvite}>Invitar amigo</ActionMenuItem>
          <ActionMenuItem onClick={onEditServer}>Editar servidor</ActionMenuItem>
          <ActionMenuItem onClick={onDeleteServer} danger>
            Eliminar servidor
          </ActionMenuItem>
        </Menu.Items>
      </Menu>
    </div>
  );
}

function ChannelListSection({
  title,
  channels,
  prefix,
  onCreate,
  serverId,
  onEditChannel,
  onDeleteChannel,
  className = "",
}) {
  const safeChannels = channels ?? [];

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-2 text-gray-400 text-sm uppercase">
        <span className="truncate">{title}</span>
        <button onClick={onCreate} className="hover:text-white" aria-label="Crear canal">
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
            onEdit={() => onEditChannel(channel)}
            onDelete={() => onDeleteChannel(channel)}
          />
        ))}
      </nav>
    </div>
  );
}

function ChannelRow({ channel, serverId, prefix, onEdit, onDelete }) {
  return (
    <div className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-700 text-gray-200">
      <Link
        to={`/servers/${serverId}/channels/${channel._id}`}
        className="flex items-center gap-2 flex-1 text-gray-200 group-hover:text-white truncate"
      >
        <span className="shrink-0">{prefix}</span>
        <span className="truncate">{channel.name}</span>
      </Link>
      <Menu as="div" className="relative ml-2">
        <Menu.Button
          type="button"
          className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-opacity px-1"
          aria-label="Opciones del canal"
        >
          ⚙
        </Menu.Button>
        <Menu.Items className="absolute right-0 mt-2 w-40 bg-gray-700 rounded shadow-lg z-20 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <ActionMenuItem onClick={onEdit}>Editar canal</ActionMenuItem>
          <ActionMenuItem onClick={onDelete} danger>
            Eliminar canal
          </ActionMenuItem>
        </Menu.Items>
      </Menu>
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
