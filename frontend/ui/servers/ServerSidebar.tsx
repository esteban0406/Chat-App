"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
    <div className="flex flex-col items-center gap-4 py-4 bg-gray-800 h-full">
      <Link
        href="/friends"
        onClick={onClose}
        className="relative w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center"
      >
        Me
        {(hasNewFriendRequests || hasNewServerInvites) && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-gray-800" />
        )}
      </Link>

      <div className="w-10 border-t border-gray-700" />

      {servers.map((server) => {
        return (
          <Link
            key={server.id}
            href={server.id ? `/servers/${server.id}` : "/servers"}
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center"
          >
            {server.name?.[0] ?? "?"}
          </Link>
        );
      })}

      <button
        onClick={() => setShowCreate(true)}
        className="w-12 h-12 rounded-full bg-gray-700 text-green-400"
      >
        +
      </button>

      {showCreate && (
        <CreateServerModal
          onClose={() => setShowCreate(false)}
          created={loadServers}
        />
      )}
    </div>
  );
}
