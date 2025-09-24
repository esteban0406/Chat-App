import { useEffect, useState } from "react";
import { getServers, deleteServer } from "../services/api";

export function useServers(activeTab) {
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);

  // 🔹 Cargar servidores cuando el tab es "servers"
  useEffect(() => {
    if (activeTab !== "servers") return;

    const fetchServers = async () => {
      try {
        const res = await getServers();
        setServers(res.data);
      } catch (err) {
        console.error("Error cargando servers:", err);
      }
    };

    fetchServers();
  }, [activeTab]);

  // 🔹 Eliminar servidor
  const removeServer = async (serverId) => {
    try {
      await deleteServer(serverId);
      setServers((prev) => prev.filter((s) => s._id !== serverId));
      if (activeServer?._id === serverId) setActiveServer(null);
    } catch (err) {
      console.error("Error eliminando servidor:", err);
      throw err;
    }
  };

  return {
    servers,
    setServers,
    activeServer,
    setActiveServer,
    removeServer,
  };
}
