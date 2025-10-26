import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchServers, selectServers } from "./serverSlice";
import CreateServerModal from "./modals/CreateServerModal";

export default function ServerSidebar() {
  const dispatch = useDispatch();
  const servers = useSelector(selectServers);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    dispatch(fetchServers()); 
  }, [dispatch]);

  return (
    <aside className="w-20 bg-gray-800 flex flex-col items-center py-4 space-y-4 border-r border-gray-600">
      {/* Perfil (lleva a /me) */}
      <Link
        to="/me"
        className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold hover:bg-indigo-500 transition"
      >
        Me
      </Link>

      <div className="border-t border-gray-700 w-10" />

      {/* Lista de servidores */}
      {servers.map((server) => (
        <Link
          key={server._id}
          to={`/servers/${server._id}`}
          className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition"
        >
          {server.name[0].toUpperCase()}
        </Link>
      ))}

      {/* --- Botón para crear servidor --- */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white transition"
        title="Crear servidor"
      >
        +
      </button>

      {/* --- Modal de crear servidor --- */}
      {showCreateModal && (
        <CreateServerModal onClose={() => setShowCreateModal(false)} />
      )}

    </aside>
  );
}
