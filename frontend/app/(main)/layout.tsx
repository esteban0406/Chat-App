"use client";

import ServerSidebar from "@/ui/servers/ServerSidebar";
import UserProfileBar from "@/ui/user/UserProfileBar";
import MobileDrawer from "@/ui/common/MobileDrawer";
import {
  LayoutContextProvider,
  useLayoutContext,
} from "@/ui/layout/LayoutContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutContextProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </LayoutContextProvider>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    isServerDrawerOpen,
    isProfileDrawerOpen,
    closeServerDrawer,
    closeProfileDrawer,
  } = useLayoutContext();

  useEffect(() => {
    let cancelled = false;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return;

    const checkSession = async () => {
      try {
        const res = await fetch(
          `${backendUrl.replace(/\/$/, "")}/api/auth/get-session`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!res.ok && !cancelled) {
          router.push("/login");
        }
      } catch {
        if (!cancelled) {
          router.push("/login");
        }
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      className="h-screen bg-gray-900 text-white md:grid"
      style={{
        gridTemplateColumns: "72px 240px minmax(0, 1fr)",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gridTemplateAreas: "'servers section chat' 'profile profile chat'",
      }}
    >
      <aside
        className="hidden border-r border-gray-700 bg-gray-800 md:block"
        style={{ gridArea: "servers" }}
      >
        <ServerSidebar />
      </aside>

      <div className="contents">{children}</div>

      <aside
        className="hidden border-t border-r border-gray-700 bg-gray-800 md:block"
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
