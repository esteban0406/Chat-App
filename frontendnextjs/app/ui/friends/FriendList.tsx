"use client";

import { useEffect, useState } from "react";

export default function FriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/friends");
        const data = await res.json();
        setFriends(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-400">Cargando amigos...</p>;

  if (!friends?.length) return <p className="text-gray-400">No tienes amigos todavía 😢</p>;

  return (
    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {friends.map((friend) => (
        <li
          key={friend.id || friend._id}
          className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700"
        >
          <span>
            <span className="font-semibold">{friend.username}</span>{" "}
            <span className="text-gray-400 text-sm">({friend.email})</span>
          </span>
          <button className="text-red-400 hover:text-red-500 text-sm">Eliminar</button>
        </li>
      ))}
    </ul>
  );
}
