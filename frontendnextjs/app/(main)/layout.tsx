"use client";

import { useState, useEffect, useMemo } from "react";
import ServerSidebar from "./servers/sidebar/ServerSidebar";
import UserProfileBar from "@/app/ui/user/UserProfileBar";
import MobileDrawer from "@/app/ui/MobileDrawer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [serverDrawerOpen, setServerDrawerOpen] = useState(false);
  const [sectionSidebarOpen, setSectionSidebarOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  /** Auto-close drawers when viewport becomes desktop */
  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setServerDrawerOpen(false);
        setSectionSidebarOpen(false);
        setProfileDrawerOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const ctx = useMemo(
    () => ({
      openServerDrawer: () => setServerDrawerOpen(true),
      closeServerDrawer: () => setServerDrawerOpen(false),
      openSectionSidebar: () => setSectionSidebarOpen(true),
      closeSectionSidebar: () => setSectionSidebarOpen(false),
      openProfileDrawer: () => setProfileDrawerOpen(true),
      closeProfileDrawer: () => setProfileDrawerOpen(false),
      isSectionSidebarOpen: sectionSidebarOpen,
      isServerDrawerOpen: serverDrawerOpen,
      isProfileDrawerOpen: profileDrawerOpen,
    }),
    [serverDrawerOpen, sectionSidebarOpen, profileDrawerOpen]
  );

  return (
    <div
      className="flex h-screen w-screen flex-col bg-gray-900 text-white md:grid"
      style={{
        gridTemplateColumns: "72px 240px minmax(0, 1fr)",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gridTemplateAreas:
          "'servers sectionSidebar chat' 'profile profile chat'",
      }}
    >
      <aside
        style={{ gridArea: "servers" }}
        className="hidden h-full border-r border-gray-700 bg-gray-800 md:block"
      >
        <ServerSidebar />
      </aside>

      <div
        style={{ gridArea: "chat" }}
        className="flex flex-col overflow-hidden"
      >
        <LayoutContextProvider value={ctx}>{children}</LayoutContextProvider>
      </div>

      <div
        style={{ gridArea: "profile" }}
        className="hidden border-t border-r border-gray-700 bg-gray-800 md:block"
      >
        <UserProfileBar />
      </div>

      <MobileDrawer
        open={serverDrawerOpen}
        side="left"
        onClose={ctx.closeServerDrawer}
      >
        <ServerSidebar onClose={ctx.closeServerDrawer} />
      </MobileDrawer>

      <MobileDrawer
        open={profileDrawerOpen}
        side="bottom"
        onClose={ctx.closeProfileDrawer}
      >
        <UserProfileBar />
      </MobileDrawer>
    </div>
  );
}

import { createContext, useContext } from "react";

const LayoutContext = createContext<any>(null);
function LayoutContextProvider({ value, children }) {
  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  return useContext(LayoutContext) ?? {};
}
