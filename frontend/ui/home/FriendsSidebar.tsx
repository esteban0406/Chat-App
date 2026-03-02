"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useFriends } from "@/lib/context/FriendsContext";
import UserAvatar from "@/ui/user/UserAvatar";

type Props = {
  sidebarControls?: {
    closeSidebar?: () => void;
  };
};

export default function FriendsSidebar({ sidebarControls }: Props) {
  const closeSidebar = sidebarControls?.closeSidebar;
  const { friends } = useFriends();
  const [search, setSearch] = useState("");

  const filtered = friends.filter((f) =>
    f.username?.toLowerCase().includes(search.toLowerCase()),
  );

  const online = filtered.filter((f) => f.status === "ONLINE");
  const offline = filtered.filter((f) => f.status !== "ONLINE");

  const renderFriend = (friend: (typeof friends)[0]) => {
    const isOnline = friend.status === "ONLINE";
    return (
      <div
        key={friend.id}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface/30 hover:text-text-primary"
      >
        <div className="relative">
          <UserAvatar src={friend.avatarUrl} username={friend.username} userId={friend.id} size={28} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar ${
              isOnline ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>
        <span className="truncate">{friend.username}</span>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <header className="flex h-[var(--header-height)] items-center justify-between border-b border-border px-3">
        <h2 className="font-display text-xl font-semibold">Amigos</h2>
        {closeSidebar && (
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar amigos..."
            className="w-full rounded-md bg-surface py-1.5 pl-8 pr-3 text-xs text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <nav className="space-y-0.5">
          {online.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                En línea — {online.length}
              </p>
              {online.map(renderFriend)}
            </>
          )}

          {offline.length > 0 && (
            <>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted ${online.length > 0 ? "mt-3" : ""}`}>
                Desconectado — {offline.length}
              </p>
              {offline.map(renderFriend)}
            </>
          )}

          {filtered.length === 0 && (
            <p className="px-2 py-2 text-xs text-text-muted">
              {search ? "Sin resultados." : "No hay amigos aún."}
            </p>
          )}
        </nav>
      </div>
    </div>
  );
}
