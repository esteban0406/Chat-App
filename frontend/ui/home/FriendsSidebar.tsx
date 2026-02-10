"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { User } from "@/lib/definitions";
import { backendFetch, unwrapList } from "@/lib/backend-client";

type Props = {
  sidebarControls?: {
    closeSidebar?: () => void;
  };
};

export default function FriendsSidebar({ sidebarControls }: Props) {
  const closeSidebar = sidebarControls?.closeSidebar;
  const [friends, setFriends] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadFriends() {
      try {
        const res = await backendFetch("/api/friendships", { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        const list = unwrapList<User>(body, "friends");
        setFriends(list);
      } catch {
        // silently fail for sidebar
      }
    }
    loadFriends();
  }, []);

  const filtered = friends.filter((f) =>
    f.username?.toLowerCase().includes(search.toLowerCase()),
  );

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

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          En línea — {filtered.length}
        </p>

        <nav className="space-y-0.5">
          {filtered.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface/30 hover:text-text-primary"
            >
              <div className="relative">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-primary">
                  {friend.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-gold" />
              </div>
              <span className="truncate">{friend.username}</span>
            </div>
          ))}

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
