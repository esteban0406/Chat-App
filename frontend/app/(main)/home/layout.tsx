"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SectionShell from "@/ui/layout/SectionShell";
import FriendsSidebar from "@/ui/home/FriendsSidebar";
import { useLayoutContext } from "@/ui/layout/LayoutContext";
import { FriendsProvider } from "@/lib/context/FriendsContext";
import { Menu, Users } from "lucide-react";
import { useNotifications } from "@/lib/context/NotificationContext";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useServers } from "@/lib/context/ServersContext";
import { isDemoMode } from "@/lib/auth";

export default function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FriendsProvider>
      <SectionShell sidebar={<FriendsSidebar />}>
        <FriendsContent>{children}</FriendsContent>
      </SectionShell>
    </FriendsProvider>
  );
}

function FriendsContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation("home");
  const {
    openServerDrawer,
    openSectionSidebar,
  } = useLayoutContext();
  const { servers } = useServers();

  const handleOpenServers = () => {
    if (isDemoMode()) {
      const step = parseInt(localStorage.getItem("demoTourStep") ?? "0", 10);
      if (step >= 2 && servers[0]) {
        router.push(`/servers/${servers[0].id}`);
        return;
      }
    }
    openServerDrawer();
  };
  const {
    hasNewFriendRequests,
    hasNewServerInvites,
    clearFriendRequests,
    clearServerInvites,
  } = useNotifications();

  const tabs = [
    { href: "/home", label: t("tabs.all"), exact: true },
    { href: "/home/requests", label: t("tabs.friendRequests") },
    { href: "/home/server-requests", label: t("tabs.serverRequests") },
  ];

  useEffect(() => {
    if (pathname.startsWith("/home/requests")) clearFriendRequests();
    if (pathname.startsWith("/home/server-requests")) clearServerInvites();
  }, [pathname, clearFriendRequests, clearServerInvites]);

  return (
    <div className="flex h-full flex-col bg-main text-white">
      <div className="border-b border-border">
        <div className="flex h-[var(--header-height)] items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenServers}
              className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-text-primary focus:outline-none"
              aria-label={t("friends.openServers")}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-text-secondary" />
              {t("friends.title")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSectionSidebar}
              className="rounded-md p-2 text-text-muted transition hover:bg-surface hover:text-text-primary focus:outline-none"
              aria-label={t("friends.openFriendsMenu")}
            >
              <Users className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="hidden h-[var(--header-height)] items-center gap-2 overflow-x-auto px-4 text-sm font-medium md:flex" data-tour="home-nav">
          <Users className="mr-1 h-4 w-4 text-text-secondary" />
          <span className="mr-3 font-semibold text-text-primary">{t("friends.title")}</span>
          <div className="mr-1 h-5 w-px bg-border" />
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const showDot =
              (tab.href === "/home/requests" && hasNewFriendRequests && !isActive) ||
              (tab.href === "/home/server-requests" && hasNewServerInvites && !isActive);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative whitespace-nowrap rounded px-3 py-1 transition ${
                  isActive
                    ? "bg-surface text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-ruby" />
                )}
              </Link>
            );
          })}
          <Link
            href="/home/add"
            className={`whitespace-nowrap rounded px-3 py-1 font-semibold transition ${
              pathname === "/home/add"
                ? "bg-gold/80 text-deep"
                : "bg-gold text-deep hover:bg-gold/90"
            }`}
          >
            {t("tabs.addFriends")}
          </Link>
        </nav>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 text-sm font-medium md:hidden" data-tour="home-nav-mobile">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const showDot =
              (tab.href === "/home/requests" && hasNewFriendRequests && !isActive) ||
              (tab.href === "/home/server-requests" && hasNewServerInvites && !isActive);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative whitespace-nowrap rounded px-3 py-1 transition ${
                  isActive
                    ? "bg-surface text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-ruby" />
                )}
              </Link>
            );
          })}
          <Link
            href="/home/add"
            className={`whitespace-nowrap rounded px-3 py-1 font-semibold transition ${
              pathname === "/home/add"
                ? "bg-gold/80 text-deep"
                : "bg-gold text-deep hover:bg-gold/90"
            }`}
          >
            {t("tabs.addFriend")}
          </Link>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {children}
      </div>
    </div>
  );
}
