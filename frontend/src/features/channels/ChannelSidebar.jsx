import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectServers } from "../servers/serverSlice";
import {
  fetchChannels,
  selectChannelsByServer,
  selectChannelsLoading,
  selectLoadedServerIds,
} from "./channelSlice";
import InviteFriendsModal from "../servers/modals/InviteFriendsModal";
import EditServerModal from "../servers/modals/EditServerModal";
import DeleteServerModal from "../servers/modals/DeleteServerModal";
import CreateChannelModal from "./CreateChannelModal";
import EditChannelModal from "./EditChannelModal";
import DeleteChannelModal from "./DeleteChannelModal";

export default function ChannelSidebar({ serverId }) {
  const dispatch = useDispatch();
  const servers = useSelector(selectServers);
  const channels = useSelector((state) =>
    selectChannelsByServer(state, serverId)
  );
  const loadingChannels = useSelector(selectChannelsLoading);
  const loadedServerIds = useSelector(selectLoadedServerIds);
  const server = servers.find((s) => s._id === serverId);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelTypeToCreate, setChannelTypeToCreate] = useState("text");
  const [channelToEdit, setChannelToEdit] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [openChannelMenuId, setOpenChannelMenuId] = useState(null);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const channelMenuRefs = useRef({});

  const setChannelMenuRef = (channelId) => (element) => {
    if (element) {
      channelMenuRefs.current[channelId] = element;
    } else {
      delete channelMenuRefs.current[channelId];
    }
  };

  const renderChannelItem = (channel, prefix) => (
    <div
      key={channel._id}
      className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-700 text-gray-200"
    >
      <Link
        to={`/servers/${serverId}/channels/${channel._id}`}
        className="flex items-center gap-2 flex-1 text-gray-200 group-hover:text-white truncate"
      >
        <span>{prefix}</span>
        <span className="truncate">{channel.name}</span>
      </Link>
      <div className="relative ml-2" ref={setChannelMenuRef(channel._id)}>
        <button
          type="button"
          className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-opacity px-1"
          onClick={(event) => {
            event.stopPropagation();
            setOpenChannelMenuId((prev) =>
              prev === channel._id ? null : channel._id
            );
            setShowMenu(false);
          }}
        >
          ⚙
        </button>
        {openChannelMenuId === channel._id && (
          <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded shadow-lg z-20">
            <button
              onClick={() => {
                setChannelToEdit(channel);
                setOpenChannelMenuId(null);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-600 text-sm text-gray-200"
            >
              Editar canal
            </button>
            <button
              onClick={() => {
                setChannelToDelete(channel);
                setOpenChannelMenuId(null);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-red-600 text-sm text-gray-200"
            >
              Eliminar canal
            </button>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (!serverId) {
      return;
    }
    const alreadyLoaded = loadedServerIds.includes(serverId);
    if (!loadingChannels && !alreadyLoaded) {
      dispatch(fetchChannels(serverId));
    }
  }, [serverId, loadedServerIds, loadingChannels, dispatch]);

  // separar canales
  const textChannels = channels.filter((ch) => ch.type === "text");
  const voiceChannels = channels.filter((ch) => ch.type === "voice");

  // Cerrar menú si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!openChannelMenuId) {
      return;
    }

    const handleOutsideClick = (event) => {
      const container = channelMenuRefs.current[openChannelMenuId];
      if (container && !container.contains(event.target)) {
        setOpenChannelMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openChannelMenuId]);

  useEffect(() => {
    setOpenChannelMenuId(null);
  }, [serverId]);

  if (!server) {
    return (
      <aside className="w-full bg-gray-800 p-3 flex flex-col">
        <h2 className="text-gray-400">Selecciona un servidor</h2>
      </aside>
    );
  }

  return (
    <aside className="w-full bg-gray-800 p-3 flex flex-col">
      {/* Encabezado servidor */}
      <div className="flex items-center justify-between mb-4 relative">
        <h2 className="text-gray-200 font-semibold">{server.name}</h2>
        <div className="relative" ref={menuRef}>
          <button
            className="text-gray-400 hover:text-white px-2"
            onClick={() => {
              setShowMenu((prev) => !prev);
              setOpenChannelMenuId(null);
            }}
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-gray-700 rounded shadow-lg z-10">
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-600 text-sm text-gray-200"
              >
                Invitar amigo
              </button>
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-600 text-sm text-gray-200"
              >
                Editar servidor
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-red-600 text-sm text-gray-200"
              >
                Eliminar servidor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canales de texto */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-2 text-gray-400 text-sm uppercase">
          <span>Canales de texto</span>
          <button
            onClick={() => {
              setChannelTypeToCreate("text");
              setShowCreateModal(true);
            }}
            className="hover:text-white"
          >
            ➕
          </button>
        </div>
        <nav className="space-y-2 mt-2">
          {textChannels.map((ch) => renderChannelItem(ch, "#"))}
        </nav>
      </div>

      {/* Canales de voz */}
      <div>
        <div className="flex items-center justify-between px-2 text-gray-400 text-sm uppercase">
          <span>Canales de voz</span>
          <button
            onClick={() => {
              setChannelTypeToCreate("voice");
              setShowCreateModal(true);
            }}
            className="hover:text-white"
          >
            ➕
          </button>
        </div>
        <nav className="space-y-2 mt-2">
          {voiceChannels.map((ch) => renderChannelItem(ch, "🔊"))}
        </nav>
      </div>

      {/* Modales */}
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}
      {showEditModal && (
        <EditServerModal
          server={server}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showDeleteModal && (
        <DeleteServerModal
          server={server}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      {showCreateModal && (
        <CreateChannelModal
          serverId={serverId}
          defaultType={channelTypeToCreate}
          onClose={() => setShowCreateModal(false)}
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
