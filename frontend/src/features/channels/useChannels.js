import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo, useState } from "react";
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

  // 🔹 Estados locales de modales
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditServerModal, setShowEditServerModal] = useState(false);
  const [showDeleteServerModal, setShowDeleteServerModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [channelTypeToCreate, setChannelTypeToCreate] = useState("text");
  const [channelToEdit, setChannelToEdit] = useState(null);
  const [channelToDelete, setChannelToDelete] = useState(null);

  // 🔹 Memoizar canales por tipo
  const textChannels = useMemo(
    () => (channels ?? []).filter((ch) => ch.type === "text"),
    [channels]
  );
  const voiceChannels = useMemo(
    () => (channels ?? []).filter((ch) => ch.type === "voice"),
    [channels]
  );

  // 🔹 Funciones Redux
  const loadChannels = useCallback(
    (id) => dispatch(fetchChannels(id)),
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

  // 🔹 Funciones de modales
  const openCreateChannelModal = (type = "text") => {
    setChannelTypeToCreate(type);
    setShowCreateChannelModal(true);
  };

  const handleEditChannel = (channel) => setChannelToEdit(channel);
  const handleDeleteChannel = (channel) => setChannelToDelete(channel);

  const handleOpenInviteModal = () => setShowInviteModal(true);
  const handleOpenEditServerModal = () => setShowEditServerModal(true);
  const handleOpenDeleteServerModal = () => setShowDeleteServerModal(true);

  return {
    // Redux
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

    // Canales clasificados
    textChannels,
    voiceChannels,

    // Estados modales
    showInviteModal,
    showEditServerModal,
    showDeleteServerModal,
    showCreateChannelModal,
    channelTypeToCreate,
    channelToEdit,
    channelToDelete,

    // Acciones modales
    setShowInviteModal,
    setShowEditServerModal,
    setShowDeleteServerModal,
    setShowCreateChannelModal,
    setChannelToEdit,
    setChannelToDelete,
    openCreateChannelModal,
    handleEditChannel,
    handleDeleteChannel,
    handleOpenInviteModal,
    handleOpenEditServerModal,
    handleOpenDeleteServerModal,
  };
}
