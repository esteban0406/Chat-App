"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SectionShell from "@/ui/layout/SectionShell";
import FriendsSidebar from "@/ui/friends/FriendsSidebar";
import { useLayoutContext } from "@/ui/layout/LayoutContext";
import {
  Bars3Icon,
  UsersIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "@/lib/NotificationContext";
import { useEffect } from "react";

const tabs = [
  { href: "/friends", label: "Todos", exact: true },
  { href: "/friends/add", label: "Agregar amigos" },
  { href: "/friends/requests", label: "Solicitudes de amistad" },
  { href: "/friends/server-requests", label: "Solicitudes a servidores" },
];

export default function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SectionShell sidebar={<FriendsSidebar />}>
      <FriendsContent>{children}</FriendsContent>
    </SectionShell>
  );
}

function FriendsContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    openServerDrawer,
    openSectionSidebar,
    openProfileDrawer,
  } = useLayoutContext();
  const {
    hasNewFriendRequests,
    hasNewServerInvites,
    clearFriendRequests,
    clearServerInvites,
  } = useNotifications();

  useEffect(() => {
    if (pathname.startsWith("/friends/requests")) clearFriendRequests();
    if (pathname.startsWith("/friends/server-requests")) clearServerInvites();
  }, [pathname, clearFriendRequests, clearServerInvites]);

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openServerDrawer}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none"
              aria-label="Abrir servidores"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Amigos</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSectionSidebar}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none"
              aria-label="Abrir menú de amigos"
            >
              <UsersIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={openProfileDrawer}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none"
              aria-label="Abrir perfil"
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex flex-nowrap gap-6 overflow-x-auto px-4 pb-3 pt-1 text-sm font-medium text-gray-400 md:px-6 md:py-4">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const showDot =
              (tab.href === "/friends/requests" && hasNewFriendRequests && !isActive) ||
              (tab.href === "/friends/server-requests" && hasNewServerInvites && !isActive);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative whitespace-nowrap pb-2 ${
                  isActive
                    ? "border-b-2 border-indigo-500 text-indigo-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab.label}
                {showDot && (
                  <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {children}
      </div>
    </div>
  );
}
