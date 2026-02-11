"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

type FriendsState = {
  friends: User[];
  loading: boolean;
  error: string | null;
  refreshFriends: () => void;
};

const FriendsContext = createContext<FriendsState>({
  friends: [],
  loading: true,
  error: null,
  refreshFriends: () => {},
});

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<User[]>([]);
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
      const list = unwrapList<User>(body, "friends");
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

  return (
    <FriendsContext.Provider value={{ friends, loading, error, refreshFriends }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  return useContext(FriendsContext);
}
