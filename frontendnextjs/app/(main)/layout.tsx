"use client";

import ServerSidebar from "@/app/ui/servers/ServerSidebar";
import UserProfileBar from "@/app/ui/user/UserProfileBar";
import MobileDrawer from "@/app/ui/common/MobileDrawer";
import {
  LayoutContextProvider,
  useLayoutContext,
} from "@/app/ui/layout/LayoutContext";

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
  const {
    isServerDrawerOpen,
    isProfileDrawerOpen,
    closeServerDrawer,
    closeProfileDrawer,
  } = useLayoutContext();

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
