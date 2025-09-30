import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchServers,
  addServer,
  removeServer,
  setActiveServer,
  selectServers,
  selectActiveServer,
  selectServersLoading,
  selectServersError,
  removeMember,
} from "./serverSlice";

export function useServers() {
  const dispatch = useDispatch();

  const servers = useSelector(selectServers);
  const activeServer = useSelector(selectActiveServer);
  const loading = useSelector(selectServersLoading);
  const error = useSelector(selectServersError);

  // Memoizar funciones para que no cambien en cada render
  const loadServers = useCallback(() => dispatch(fetchServers()), [dispatch]);
  const createServer = useCallback(
    (serverData) => dispatch(addServer(serverData)),
    [dispatch]
  );
  const deleteServerById = useCallback(
    (serverId) => dispatch(removeServer(serverId)),
    [dispatch]
  );
  const setActive = useCallback(
    (server) => dispatch(setActiveServer(server)),
    [dispatch]
  );
  const removeMemberById = (serverId, memberId) =>
    dispatch(removeMember({ serverId, memberId }));

  return {
    servers,
    activeServer,
    loading,
    error,
    loadServers,
    createServer,
    deleteServerById,
    setActive,
    removeMemberById,
  };
}
