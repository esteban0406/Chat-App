"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { House, Plus } from "lucide-react";
import { Server } from "@/lib/definitions";
import CreateServerModal from "./modals/CreateServerModal";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";
import { useNotifications } from "@/lib/NotificationContext";

export default function ServerSidebar({ onClose }: { onClose?: () => void }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const pathname = usePathname();
  const { hasNewFriendRequests, hasNewServerInvites } = useNotifications();

  const loadServers = useCallback(() => {
    async function loadServer() {
      try {
        const res = await backendFetch("/api/servers", {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = await extractErrorMessage(res, "No se pudieron cargar los servidores");
          throw new Error(msg);
        }
        const body = await res.json();
        const list = unwrapList<Server>(body, "servers");
        setServers(list);
      } catch (error) {
        console.error("Error loading servers:", error);
        setServers([]);
      }
    }
    loadServer();
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers, pathname]);

  return (
    <div className="flex flex-col items-center bg-deep h-full">
      <div className="flex h-[var(--header-height)] w-full shrink-0 items-center justify-center border-b border-border">
        <Link
          href="/friends"
          onClick={onClose}
          className="relative flex h-12 w-12 items-center justify-center rounded-[14px] bg-gold shadow-md shadow-black/25 transition-transform hover:scale-105"
        >
          <House className="h-5 w-5 text-deep" />
          {(hasNewFriendRequests || hasNewServerInvites) && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-ruby border-2 border-deep" />
          )}
        </Link>
      </div>

      <div className="flex flex-col items-center gap-3 overflow-y-auto py-3">
      {servers.map((server) => {
        return (
          <Link
            key={server.id}
            href={server.id ? `/servers/${server.id}` : "/servers"}
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-sm font-semibold text-text-secondary shadow-md shadow-black/25 transition-all hover:rounded-[14px] hover:bg-gold hover:text-deep"
          >
            {server.name?.[0] ?? "?"}
          </Link>
        );
      })}

      <button
        onClick={() => setShowCreate(true)}
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-gold-muted text-gold transition-all hover:rounded-[14px] hover:bg-gold hover:text-deep"
      >
        <Plus className="h-5 w-5" />
      </button>
      </div>

      {showCreate && (
        <CreateServerModal
          onClose={() => setShowCreate(false)}
          created={loadServers}
        />
      )}
    </div>
  );
}
