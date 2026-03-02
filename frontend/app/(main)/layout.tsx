"use client";

import ServerSidebar from "@/ui/servers/ServerSidebar";
import UserProfileBar from "@/ui/user/UserProfileBar";
import MobileDrawer from "@/ui/common/MobileDrawer";
import {
  LayoutContextProvider,
  useLayoutContext,
} from "@/ui/layout/LayoutContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { NotificationProvider } from "@/lib/context/NotificationContext";
import { CurrentUserProvider } from "@/lib/context/CurrentUserContext";
import { ServersProvider } from "@/lib/context/ServersContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      connectSocket();
      setIsChecking(false); // eslint-disable-line react-hooks/set-state-in-effect
    }
    return () => {
      disconnectSocket();
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-deep text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <LayoutContextProvider>
      <NotificationProvider>
        <CurrentUserProvider>
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
    isProfileDrawerOpen,
    closeServerDrawer,
    closeProfileDrawer,
  } = useLayoutContext();

  return (
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

      <MobileDrawer
        open={isServerDrawerOpen}
        side="left"
        onClose={closeServerDrawer}
      >
        <ServerSidebar onClose={closeServerDrawer} />
      </MobileDrawer>

      <MobileDrawer
        open={isProfileDrawerOpen}
        side="bottom"
        onClose={closeProfileDrawer}
      >
        <UserProfileBar />
      </MobileDrawer>
    </div>
  );
}
