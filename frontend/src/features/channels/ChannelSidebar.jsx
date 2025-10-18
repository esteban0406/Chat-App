import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectServers } from "../servers/serverSlice";
import { selectChannelsByServer } from "./channelSlice";
import InviteFriendsModal from "../servers/modals/InviteFriendsModal";
import EditServerModal from "../servers/modals/EditServerModal";
import DeleteServerModal from "../servers/modals/DeleteServerModal";

export default function ChannelSidebar({ serverId }) {
  const servers = useSelector(selectServers);
  const channels = useSelector((state) =>
    selectChannelsByServer(state, serverId)
  );
  const server = servers.find((s) => s._id === serverId);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!server) {
    return (
      <aside className="w-60 bg-gray-800 p-3 flex flex-col">
        <h2 className="text-gray-400">Selecciona un servidor</h2>
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-gray-800 p-3 flex flex-col">
      {/* Encabezado con menú */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-200 font-semibold">{server.name}</h2>
        <div className="relative group">
          <button className="text-gray-400 hover:text-white">⋮</button>
          <div className="absolute right-0 mt-2 w-44 bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setShowInviteModal(true)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-600 text-sm text-gray-200"
            >
              Invitar amigo
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-600 text-sm text-gray-200"
            >
              Editar servidor
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="block w-full text-left px-4 py-2 hover:bg-red-600 text-sm text-red-200"
            >
              Eliminar servidor
            </button>
          </div>
        </div>
      </div>

      {/* Lista de canales */}
      <nav className="space-y-2">
        {channels.map((ch) => (
          <Link
            key={ch._id}
            to={`/servers/${serverId}/channels/${ch._id}`}
            className="block px-3 py-2 rounded-md hover:bg-gray-700 text-gray-200"
          >
            {ch.type === "voice" ? "🔊" : "#"} {ch.name}
          </Link>
        ))}
      </nav>

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
    </aside>
  );
}
