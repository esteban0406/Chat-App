import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchChannels } from "../channels/channelSlice";
import ChannelSidebar from "../channels/ChannelSidebar";

export default function ServerLayout() {
  const { serverId } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (serverId) {
      dispatch(fetchChannels(serverId));
    }
  }, [serverId, dispatch]);

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
