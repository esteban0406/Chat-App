"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

export default function FriendList() {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFriends() {
      setLoading(true);
      setError(null);
      try {
        const res = await backendFetch("/api/friendships", {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = await extractErrorMessage(res, "No se pudieron cargar tus amigos");
          throw new Error(msg);
        }

        const body = await res.json();
        const list = unwrapList<User>(body, "friends");
        if (!cancelled) {
          setFriends(list);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "No se pudieron cargar tus amigos";
          setError(message);
          setFriends([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFriends();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-gray-400">Cargando amigos...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!friends.length) {
    return <p className="text-gray-400">No tienes amigos todavía 😢</p>;
  }

  return (
    <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
      {friends.map((friend) => (
        <li
          key={friend.id}
          className="flex items-center justify-between rounded-md bg-gray-800 px-4 py-2 text-sm text-white"
        >
          <span className="truncate">
            <span className="font-semibold">{friend.username}</span>{" "}
            <span className="text-gray-400">({friend.email})</span>
          </span>
          <button className="text-red-400 hover:text-red-300 text-xs">
            Eliminar
          </button>
        </li>
      ))}
    </ul>
  );
}
