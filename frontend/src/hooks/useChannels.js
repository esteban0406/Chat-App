import { useEffect, useState } from "react";
import { getChannels, deleteChannel } from "../services/api";

export function useChannels(activeServer, onSelectChannel) {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);

  // 🔹 Cargar canales cuando cambia el servidor activo
  useEffect(() => {
    if (!activeServer) return;

    const fetchChannels = async () => {
      try {
        const res = await getChannels(activeServer._id);
        setChannels(res.data);

        if (res.data.length > 0) {
          setActiveChannel(res.data[0]);
          onSelectChannel(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error cargando canales:", err);
      }
    };

    fetchChannels();
  }, [activeServer, onSelectChannel]);

  // 🔹 Eliminar canal
  const removeChannel = async (channelId) => {
    try {
      await deleteChannel(channelId);
      setChannels((prev) => prev.filter((ch) => ch._id !== channelId));

      if (activeChannel?._id === channelId) {
        setActiveChannel(null);
        onSelectChannel(null);
      }
    } catch (err) {
      console.error("Error eliminando canal:", err);
      throw err;
    }
  };

  return {
    channels,
    setChannels,
    activeChannel,
    setActiveChannel,
    removeChannel,
  };
}
