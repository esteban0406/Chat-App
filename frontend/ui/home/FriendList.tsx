"use client";

import { useState } from "react";
import { useFriends } from "@/lib/context/FriendsContext";
import UserAvatar from "@/ui/user/UserAvatar";

export default function FriendList() {
  const { friends, loading, error, removeFriend } = useFriends();
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (loading) {
    return <p className="text-text-muted">Cargando amigos...</p>;
  }

  if (error) {
    return <p className="text-ruby">{error}</p>;
  }

  if (!friends.length) {
    return <p className="text-text-muted">No tienes amigos todavía.</p>;
  }

  async function handleRemove(friendshipId: string) {
    setRemovingId(friendshipId);
    try {
      await removeFriend(friendshipId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
      {friends.map((friend) => {
        return (
          <li
            key={friend.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface/40 px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3 truncate">
              <UserAvatar src={friend.avatarUrl} username={friend.username} userId={friend.id} size={32} />

              <span className="truncate">
                <span className="font-semibold text-text-primary">
                  {friend.username}
                </span>{" "}
                <span className="text-text-muted">({friend.email})</span>
              </span>
            </div>
            <button
              disabled={removingId === friend.friendshipId}
              onClick={() => handleRemove(friend.friendshipId)}
              className="text-xs text-ruby hover:text-ruby/80 disabled:opacity-50"
            >
              {removingId === friend.friendshipId ? "Eliminando..." : "Eliminar"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
