"use client";

import ServerSidebar from "@/ui/servers/ServerSidebar";
import UserProfileBar from "@/ui/user/UserProfileBar";
import MobileNavDrawer from "@/ui/layout/MobileNavDrawer";
import {
  LayoutContextProvider,
  useLayoutContext,
} from "@/ui/layout/LayoutContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSession, SessionCheck } from "@/lib/auth";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { NotificationProvider } from "@/lib/context/NotificationContext";
import { CurrentUserProvider } from "@/lib/context/CurrentUserContext";
import { ServersProvider } from "@/lib/context/ServersContext";
import { useTranslation } from "react-i18next";
import DemoTourLoader from "@/ui/demo/DemoTourLoader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [session, setSession] = useState<SessionCheck | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // A stored token is not enough: confirm with the backend that the session
    // is still valid. checkSession() clears it when the backend rejects it.
    checkSession().then((result) => {
      if (cancelled) return;
      if (result.status === "unauthenticated") {
        router.replace("/login");
        return;
      }
      if (result.status === "authenticated") {
        connectSocket();
      }
      setSession(result);
    });

    return () => {
      cancelled = true;
      disconnectSocket();
    };
  }, [router, attempt]);

  const retry = () => {
    setSession(null);
    setAttempt((n) => n + 1);
  };

  if (session?.status === "unreachable") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-deep text-white">
        <p>{t("connectionError")}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-deep transition hover:bg-gold/90"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (session?.status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-deep text-white">
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <LayoutContextProvider>
      <NotificationProvider>
        <CurrentUserProvider initialUser={session.user}>
          <ServersProvider>
            <AppLayoutInner>{children}</AppLayoutInner>
          </ServersProvider>
        </CurrentUserProvider>
      </NotificationProvider>
    </LayoutContextProvider>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    isServerDrawerOpen,
    closeServerDrawer,
  } = useLayoutContext();

  return (
    <>
      <div
        className="h-screen bg-deep text-white md:grid"
        style={{
          gridTemplateColumns: "var(--nav-width) var(--sidebar-width) minmax(0, 1fr)",
          gridTemplateRows: "minmax(0, 1fr) var(--footer-height)",
          gridTemplateAreas: "'servers section chat' 'profile profile chat'",
        }}
      >
        <aside
          className="hidden border-r border-border bg-deep md:block"
          style={{ gridArea: "servers" }}
        >
          <ServerSidebar />
        </aside>

        <div className="contents">{children}</div>

        <aside
          className="hidden border-t border-r border-border bg-deep md:block"
          style={{ gridArea: "profile" }}
        >
          <UserProfileBar />
        </aside>

        <MobileNavDrawer open={isServerDrawerOpen} onClose={closeServerDrawer} />
      </div>
      <DemoTourLoader />
    </>
  );
}
