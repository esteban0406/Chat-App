"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useServers } from "@/lib/context/ServersContext";
import { isDemoMode } from "@/lib/auth";

export default function ServerHomePage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const { servers, loading } = useServers();

  useEffect(() => {
    if (loading || !isDemoMode()) return;
    const server = servers.find((s) => s.id === serverId);
    const aiChannel = server?.channels?.find((c) => c.name === "ai-chatbot");
    if (aiChannel) {
      router.replace(`/servers/${serverId}/channels/${aiChannel.id}`);
    }
  }, [loading, servers, serverId, router]);

  if (isDemoMode()) return null;

  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      Selecciona un canal del servidor
    </div>
  );
}
