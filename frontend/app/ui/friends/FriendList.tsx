"use client";

import { useEffect, useState } from "react";
import { User } from "@/app/lib/definitions";

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
        const res = await fetch("/api/friends", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("No se pudieron cargar tus amigos");
        }

        const data: User[] = await res.json();
        if (!cancelled) {
          setFriends(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("No se pudieron cargar tus amigos");
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
