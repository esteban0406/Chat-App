import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchChannels } from "../channels/channelSlice";
import { useServers } from "./useServers";
import ChannelSidebar from "../channels/ChannelSidebar";
export function ServerSectionSidebar() {
  const { serverId } = useParams();
  return <ChannelSidebar serverId={serverId} />;
}
export default function ServerLayout() {
  const { serverId } = useParams();
  const dispatch = useDispatch();
  const { servers, setActive } = useServers();
  useEffect(() => {
    if (!serverId) {
      return;
    }
    dispatch(fetchChannels(serverId));
    const current = servers.find((server) => server._id === serverId);
    if (current) {
      setActive(current);
    }
  }, [serverId, servers, dispatch, setActive]);
  return <Outlet />;
}
