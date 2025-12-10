// app/(main)/servers/sidebar/ServerSidebar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ServerSidebar({ onClose }: { onClose?: () => void }) {
  const [servers, setServers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function loadServers() {
      const res = await fetch("/api/servers"); // we will create this route
      const data = await res.json();
      setServers(data);
    }
    loadServers();
  }, []);

  return (
    <div className="flex h-full flex-col items-center space-y-4 bg-gray-900 py-4">
      
      {/* Mobile header */}
      <div className="flex w-full items-center justify-between px-3 md:hidden">
        <span className="text-sm font-semibold uppercase text-gray-400">
          Servidores
        </span>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ME button */}
      <Link
        href="/me"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
        onClick={onClose}
      >
        ME
      </Link>

      <div className="border-t border-gray-700 w-10" />

      {/* Server List */}
      {servers.map((server: any) => (
        <Link
          key={server._id}
          href={`/servers/${server._id}`}
          className="flex h-12 w-12 rounded-full bg-gray-700 hover:bg-gray-600 items-center justify-center"
          onClick={onClose}
        >
          {server.name?.[0]?.toUpperCase()}
        </Link>
      ))}

      {/* Create server */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white"
      >
        +
      </button>

      {/* Modal */}
      {showCreateModal && (
        <div className="text-white">Modal goes here</div>
      )}
    </div>
  );
}
