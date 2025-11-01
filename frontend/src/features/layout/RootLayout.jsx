import { Outlet } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import ServerSidebar from "../servers/ServerSidebar";
import UserProfileBar from "../user/UserProfileBar";

export default function RootLayout() {
  const [serverDrawerOpen, setServerDrawerOpen] = useState(false);
  const [sectionSidebarOpen, setSectionSidebarOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

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

  const closeServerDrawer = useCallback(() => setServerDrawerOpen(false), []);
  const closeSectionSidebar = useCallback(
    () => setSectionSidebarOpen(false),
    [],
  );
  const closeProfileDrawer = useCallback(() => setProfileDrawerOpen(false), []);

  const outletContext = useMemo(
    () => ({
      openServerDrawer: () => setServerDrawerOpen(true),
      closeServerDrawer,
      openSectionSidebar: () => setSectionSidebarOpen(true),
      closeSectionSidebar,
      openProfileDrawer: () => setProfileDrawerOpen(true),
      closeProfileDrawer,
      isSectionSidebarOpen: sectionSidebarOpen,
      isServerDrawerOpen: serverDrawerOpen,
      isProfileDrawerOpen: profileDrawerOpen,
    }),
    [
      closeProfileDrawer,
      closeSectionSidebar,
      closeServerDrawer,
      profileDrawerOpen,
      sectionSidebarOpen,
      serverDrawerOpen,
    ],
  );

  return (
    <div
      className="flex h-screen w-screen flex-col bg-gray-900 text-white md:grid"
      style={{
        gridTemplateColumns: "72px 240px minmax(0, 1fr)",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gridTemplateAreas: "'servers sectionSidebar chat' 'profile profile chat'",
      }}
    >
      <aside
        className="hidden h-full border-r border-gray-700 bg-gray-800 md:block"
        style={{ gridArea: "servers" }}
      >
        <ServerSidebar />
      </aside>

      <Outlet context={outletContext} />

      <div
        className="hidden border-t border-r border-gray-700 bg-gray-800 md:block"
        style={{ gridArea: "profile" }}
      >
        <UserProfileBar />
      </div>

      {serverDrawerOpen && (
        <MobileDrawer side="left" onClose={closeServerDrawer}>
          <ServerSidebar onClose={closeServerDrawer} />
        </MobileDrawer>
      )}

      {profileDrawerOpen && (
        <MobileDrawer side="bottom" onClose={closeProfileDrawer}>
          <UserProfileBar />
        </MobileDrawer>
      )}

    </div>
  );
}

function MobileDrawer({ children, onClose, side = "left" }) {
  const basePanelClasses =
    "absolute bg-gray-800 shadow-xl transition-transform duration-200 ease-out";
  const sideClasses = {
    left: "left-0 top-0 bottom-0 w-64 max-w-[80%]",
    right: "right-0 top-0 bottom-0 w-64 max-w-[80%]",
    bottom: "left-0 right-0 bottom-0 w-full max-h-[75%] rounded-t-xl",
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <button
        type="button"
        aria-label="Cerrar panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className={`${basePanelClasses} ${sideClasses[side]}`}>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
