"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useServers } from "@/lib/context/ServersContext";
import { useLayoutContext } from "@/ui/layout/LayoutContext";
import { isDemoMode } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";

export default function ServerHomePage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const { servers, loading } = useServers();
  const { openServerDrawer } = useLayoutContext();
  const { t } = useTranslation("channels");

  const server = servers.find((s) => s.id === serverId);

  useEffect(() => {
    if (loading || !isDemoMode()) return;
    const aiChannel = server?.channels?.find((c) => c.name === "ai-chatbot");
    if (aiChannel) {
      router.replace(`/servers/${serverId}/channels/${aiChannel.id}`);
    }
  }, [loading, server, serverId, router]);

  return (
    <div className="flex h-full flex-col">
      {/* Mobile-only header */}
      <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border px-4 md:hidden">
        <button
          type="button"
          onClick={openServerDrawer}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-text-primary focus:outline-none"
          aria-label="Abrir servidores"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-text-primary">{server?.name ?? ""}</span>
        {/* Spacer to keep server name centered */}
        <div className="w-11" />
      </header>

      {!isDemoMode() && (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          <p>{t("channels:sidebar.selectChannel")}</p>
        </div>
      )}
    </div>
  );
}
