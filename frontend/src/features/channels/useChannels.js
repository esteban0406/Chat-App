import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchChannels,
  addChannel,
  removeChannel,
  updateChannelName,
  setActiveChannel,
  clearChannels,
  selectChannels,
  selectActiveChannel,
  selectChannelsLoading,
  selectChannelsError,
} from "./channelSlice";
import { selectActiveServer } from "../servers/serverSlice";

export function useChannels() {
  const dispatch = useDispatch();

  const channels = useSelector(selectChannels);
  const activeChannel = useSelector(selectActiveChannel);
  const activeServer = useSelector(selectActiveServer);
  const loading = useSelector(selectChannelsLoading);
  const error = useSelector(selectChannelsError);

  // Memoizar para evitar que cambien en cada render
  const loadChannels = useCallback(
    (serverId) => dispatch(fetchChannels(serverId)),
    [dispatch]
  );

  const createChannel = useCallback(
    (channelData) => dispatch(addChannel(channelData)),
    [dispatch]
  );

  const deleteChannelById = useCallback(
    (channelId) => dispatch(removeChannel(channelId)),
    [dispatch]
  );

  const updateChannelById = useCallback(
    ({ channelId, name }) => dispatch(updateChannelName({ channelId, name })),
    [dispatch]
  );

  const setActive = useCallback(
    (channel) => dispatch(setActiveChannel(channel)),
    [dispatch]
  );

  const clear = useCallback(() => dispatch(clearChannels()), [dispatch]);

  return {
    channels,
    activeChannel,
    activeServer,
    loading,
    error,
    loadChannels,
    createChannel,
    deleteChannelById,
    updateChannelById,
    setActive,
    clear,
  };
}
