import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectServers } from "../servers/serverSlice";
import { selectChannelsByServer } from "./channelSlice";
import InviteFriendsModal from "../servers/modals/InviteFriendsModal";
import EditServerModal from "../servers/modals/EditServerModal";
import DeleteServerModal from "../servers/modals/DeleteServerModal";
import CreateChannelModal from "./CreateChannelModal";

export default function ChannelSidebar({ serverId }) {
  const servers = useSelector(selectServers);
  const channels = useSelector((state) =>
    selectChannelsByServer(state, serverId)
  );
  const server = servers.find((s) => s._id === serverId);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelTypeToCreate, setChannelTypeToCreate] = useState("text");

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

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

  if (!server) {
    return (
      <aside className="w-60 bg-gray-800 p-3 flex flex-col">
        <h2 className="text-gray-400">Selecciona un servidor</h2>
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-gray-800 p-3 flex flex-col">
      {/* Encabezado servidor */}
      <div className="flex items-center justify-between mb-4 relative">
        <h2 className="text-gray-200 font-semibold">{server.name}</h2>
        <div className="relative" ref={menuRef}>
          <button
            className="text-gray-400 hover:text-white px-2"
            onClick={() => setShowMenu((prev) => !prev)}
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
          {textChannels.map((ch) => (
            <Link
              key={ch._id}
              to={`/servers/${serverId}/channels/${ch._id}`}
              className="block px-3 py-2 rounded-md hover:bg-gray-700 text-gray-200"
            >
              # {ch.name}
            </Link>
          ))}
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
          {voiceChannels.map((ch) => (
            <Link
              key={ch._id}
              to={`/servers/${serverId}/channels/${ch._id}`}
              className="block px-3 py-2 rounded-md hover:bg-gray-700 text-gray-200"
            >
              🔊 {ch.name}
            </Link>
          ))}
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
    </aside>
  );
}
