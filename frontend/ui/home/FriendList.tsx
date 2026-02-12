"use client";

import { useFriends } from "@/lib/FriendsContext";

export default function FriendList() {
  const { friends, loading, error } = useFriends();

  if (loading) {
    return <p className="text-text-muted">Cargando amigos...</p>;
  }

  if (error) {
    return <p className="text-ruby">{error}</p>;
  }

  if (!friends.length) {
    return <p className="text-text-muted">No tienes amigos todavía.</p>;
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-primary overflow-hidden border border-border/50">
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={friend.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.classList.add("hidden");
                    }}
                  />
                ) : (
                  <span>{friend.username?.[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>

              <span className="truncate">
                <span className="font-semibold text-text-primary">
                  {friend.username}
                </span>{" "}
                <span className="text-text-muted">({friend.email})</span>
              </span>
            </div>
            <button className="text-xs text-ruby hover:text-ruby/80">
              Eliminar
            </button>
          </li>
        );
      })}
    </ul>
  );
}
