"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Server } from "@/app/lib/definitions";
import CreateServerModal from "./modals/CreateServerModal";

export default function ServerSidebar({ onClose }: { onClose?: () => void }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/servers")
      .then((res) => res.json())
      .then(setServers)
      .catch(() => setServers([]));
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-4 bg-gray-800 h-full">
      <Link
        href="/me"
        onClick={onClose}
        className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center"
      >
        Me
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

      {showCreate && <CreateServerModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
