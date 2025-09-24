import React from "react";
import { deleteServer } from "../../services/api";

export default function ServerSection({
  servers,
  setServers,
  activeServer,
  setActiveServer,
  setChannels,
  setActiveChannel,
  onOpenCreateServer,
}) {
  return (
    <>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Servers
        <div>
          <button
            style={{ marginLeft: "10px", cursor: "pointer" }}
            onClick={onOpenCreateServer}
          >
            ➕
          </button>
          {activeServer && (
            <button
              style={{ marginLeft: "5px", cursor: "pointer", color: "red" }}
              onClick={async () => {
                if (
                  window.confirm(
                    `¿Seguro que quieres eliminar ${activeServer.name}?`
                  )
                ) {
                  try {
                    await deleteServer(activeServer._id);
                    setServers(
                      servers.filter((s) => s._id !== activeServer._id)
                    );
                    setActiveServer(null);
                    setChannels([]);
                    setActiveChannel(null);
                  } catch (err) {
                    console.error("Error eliminando servidor:", err);
                    alert("No se pudo eliminar el servidor ❌");
                  }
                }
              }}
            >
              ➖
            </button>
          )}
        </div>
      </h2>

      <ul className="user-list">
        {servers.map((server) => (
          <li
            key={server._id}
            onClick={() => setActiveServer(server)}
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
