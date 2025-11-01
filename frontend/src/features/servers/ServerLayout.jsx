import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useServers } from "./useServers";
import ChannelSidebar from "../channels/ChannelSidebar";

export function ServerSectionSidebar({ sidebarControls }) {
  const { serverId } = useParams();
  return (
    <ChannelSidebar
      serverId={serverId}
      sidebarControls={sidebarControls}
    />
  );
}
export default function ServerLayout() {
  const { serverId } = useParams();
  const { servers, setActive } = useServers();
  const layoutContext = useOutletContext();

  useEffect(() => {
    if (!serverId) {
      return;
    }
    const current = servers.find(
      (server) => server._id === serverId || server.id === serverId
    );
    if (current) {
      setActive(current);
    }
  }, [serverId, servers, setActive]);
  return <Outlet context={layoutContext} />;
}
