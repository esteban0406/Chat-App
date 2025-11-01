import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { fetchServers, selectServers } from "./serverSlice";
import CreateServerModal from "./modals/CreateServerModal";

export default function ServerSidebar({ onClose }) {
  const dispatch = useDispatch();
  const servers = useSelector(selectServers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const serverList = Array.isArray(servers) ? servers : [];

  useEffect(() => {
    dispatch(fetchServers());
  }, [dispatch]);

  return (
    <div className="flex h-full w-full flex-col items-center space-y-4 bg-gray-800 py-4">
      {/* Mobile header */}
      <div className="flex w-full items-center justify-between px-3 md:hidden">
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Servidores
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Cerrar servidores"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Perfil (lleva a /me) */}
      <Link
        to="/me"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-500"
        onClick={onClose}
      >
        Me
      </Link>

      <div className="border-t border-gray-700 w-10" />

      {/* Lista de servidores */}
      {serverList.map((server) => (
        <Link
          key={server._id}
          to={`/servers/${server._id}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 transition hover:bg-gray-600"
          onClick={onClose}
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
