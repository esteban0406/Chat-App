"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";
import { useNotificationSocket } from "@/lib/useNotificationSocket";

export type FriendEntry = User & { friendshipId: string };

type FriendsState = {
  friends: FriendEntry[];
  loading: boolean;
  error: string | null;
  refreshFriends: () => void;
  removeFriend: (friendshipId: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsState>({
  friends: [],
  loading: true,
  error: null,
  refreshFriends: () => {},
  removeFriend: async () => {},
});

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await backendFetch("/api/friendships", { cache: "no-store" });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudieron cargar tus amigos");
        throw new Error(msg);
      }
      const body = await res.json();
      const list = unwrapList<FriendEntry>(body, "friends");
      setFriends(list);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudieron cargar tus amigos";
      setError(message);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const res = await backendFetch(`/api/friendships/${friendshipId}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) {
      const msg = await extractErrorMessage(res, "No se pudo eliminar al amigo");
      throw new Error(msg);
    }
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
  }, []);

  useNotificationSocket({
    onUserStatusChanged: useCallback(
      ({ userId, status }: { userId: string; status: "ONLINE" | "OFFLINE" }) => {
        setFriends((prev) =>
          prev.map((f) => (f.id === userId ? { ...f, status } : f)),
        );
      },
      [],
    ),
    onFriendshipRemoved: useCallback(
      ({ removedBy }: { friendshipId: string; removedBy: string }) => {
        setFriends((prev) => prev.filter((f) => f.id !== removedBy));
      },
      [],
    ),
  });

  return (
    <FriendsContext.Provider value={{ friends, loading, error, refreshFriends, removeFriend }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  return useContext(FriendsContext);
}
