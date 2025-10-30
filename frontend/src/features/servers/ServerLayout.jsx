import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useServers } from "./useServers";
import ChannelSidebar from "../channels/ChannelSidebar";

export function ServerSectionSidebar() {
  const { serverId } = useParams();
  return <ChannelSidebar serverId={serverId} />;
}
export default function ServerLayout() {
  const { serverId } = useParams();
  const { servers, setActive } = useServers();

  useEffect(() => {
    if (!serverId) {
      return;
    }
    const current = servers.find((server) => server._id === serverId);
    if (current) {
      setActive(current);
    }
  }, [serverId, servers, setActive]);
  return <Outlet />;
}
