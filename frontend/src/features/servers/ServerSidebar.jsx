import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchServers, selectServers } from "./serverSlice";
import CreateServerModal from "./modals/CreateServerModal";

export default function ServerSidebar() {
  const dispatch = useDispatch();
  const servers = useSelector(selectServers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const serverList = Array.isArray(servers) ? servers : [];

  useEffect(() => {
    dispatch(fetchServers()); 
  }, [dispatch]);

  return (
    <div className="flex h-full w-full flex-col items-center space-y-4 bg-gray-800 py-4">
      {/* Perfil (lleva a /me) */}
      <Link
        to="/me"
        className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold hover:bg-indigo-500 transition"
      >
        Me
      </Link>

      <div className="border-t border-gray-700 w-10" />

      {/* Lista de servidores */}
      {serverList.map((server) => (
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
    </div>
  );
}
