"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

export type LayoutContextType = {
  openServerDrawer: () => void;
  closeServerDrawer: () => void;
  openSectionSidebar: () => void;
  closeSectionSidebar: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  isSectionSidebarOpen: boolean;
  isServerDrawerOpen: boolean;
  isProfileDrawerOpen: boolean;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const value = useMemo(
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
    [sectionSidebarOpen, serverDrawerOpen, profileDrawerOpen]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error(
      "useLayoutContext must be used inside LayoutContextProvider"
    );
  }
  return ctx;
}
