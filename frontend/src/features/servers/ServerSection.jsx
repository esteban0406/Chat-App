import React, { useEffect, useState } from "react";
import { useServers } from "./useServers";
import "./ServerSection.css";
import EditServerModal from "./modals/editServerModal";

export default function ServerSection({ onOpenCreateServer }) {
  const {
    servers,
    activeServer,
    loading,
    error,
    loadServers,
    deleteServerById,
    setActive,
  } = useServers();

  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  if (loading) return <p>Cargando servidores...</p>;
  if (error) return <p>Error: {error}</p>;

  const handleDelete = async () => {
    if (
      window.confirm(`¿Seguro que quieres eliminar ${activeServer.name}?`)
    ) {
      try {
        await deleteServerById(activeServer._id).unwrap();
      } catch (err) {
        alert("No se pudo eliminar el servidor ❌", console.error(err));
      }
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  return (
    <>
      <h2 style={{ display: "flex", justifyContent: "space-between" }}>
        Servers
        <div>
          <button onClick={onOpenCreateServer}>➕</button>
          {activeServer && <button onClick={handleDelete}>➖</button>}
          {activeServer && <button onClick={handleEdit}>✏️</button>}
        </div>
      </h2>

      <ul className="user-list">
        {servers.map((server) => (
          <li
            key={server._id}
            onClick={() => setActive(server)}
            className={`server-item ${
              activeServer?._id === server._id ? "active" : ""
            }`}
          >
            {server.name}
          </li>
        ))}
      </ul>

      {showEditModal && (
        <EditServerModal
          onClose={() => setShowEditModal(false)}
          onSave={loadServers}
        />
      )}
    </>
  );
}
