import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchChannels } from "../channels/channelSlice";
import { useServers } from "../servers/useServers";
import ChannelSidebar from "../channels/ChannelSidebar";

export default function ServerLayout() {
  const { serverId } = useParams();
  const dispatch = useDispatch();
  const { servers, setActive } = useServers();

  useEffect(() => {
    if (serverId) {
      // 1. cargar canales
      dispatch(fetchChannels(serverId));

      // 2. setear servidor activo en Redux
      const current = servers.find((s) => s._id === serverId);
      if (current) {
        setActive(current);
      }
    }
  }, [serverId, servers, dispatch, setActive]);

  return (
    <div className="flex h-full w-full bg-gray-800">
      {/* Sidebar secundario (canales del server activo) */}
      <ChannelSidebar serverId={serverId} />

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-900 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
