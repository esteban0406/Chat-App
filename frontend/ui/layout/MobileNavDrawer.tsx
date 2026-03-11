"use client";

import { useEffect } from "react";
import ServerSidebar from "@/ui/servers/ServerSidebar";
import ChannelSidebar from "@/ui/channels/ChannelSidebar";
import UserProfileBar from "@/ui/user/UserProfileBar";

export default function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer panel */}
      <div className="relative z-10 flex h-full w-[90%] max-w-sm shadow-xl">
        {/* Left column: server icon strip */}
        <div className="flex h-full w-16 shrink-0 flex-col bg-deep">
          <ServerSidebar onClose={onClose} />
        </div>

        {/* Right column: channel list + profile bar */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sidebar">
          <div className="flex-1 overflow-y-auto">
            <ChannelSidebar sidebarControls={{ closeSidebar: onClose }} />
          </div>
          <div className="shrink-0 border-t border-border">
            <UserProfileBar />
          </div>
        </div>
      </div>
    </div>
  );
}
