import React, { useEffect } from "react";
import { useServers } from "./useServers";

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

  return (
    <>
      <h2 style={{ display: "flex", justifyContent: "space-between" }}>
        Servers
        <div>
          <button onClick={onOpenCreateServer}>➕</button>
          {activeServer && <button onClick={handleDelete}>➖</button>}
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
    </>
  );
}
