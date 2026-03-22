"use client";

import {
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react";
import { useLayoutContext } from "./LayoutContext";

type SidebarControls = {
  closeSidebar: () => void;
};

type SidebarProp =
  | ReactElement<{ sidebarControls?: SidebarControls }>
  | ((args: { sidebarControls: SidebarControls }) => ReactNode)
  | null
  | undefined;

type SectionShellProps = {
  sidebar?: SidebarProp;
  children: ReactNode;
};

export default function SectionShell({
  sidebar,
  children,
}: SectionShellProps) {
  const { isSectionSidebarOpen, closeSectionSidebar } = useLayoutContext();

  const sidebarControls: SidebarControls = {
    closeSidebar: closeSectionSidebar,
  };

  let sidebarContent: ReactNode = null;

  if (typeof sidebar === "function") {
    sidebarContent = sidebar({ sidebarControls });
  } else if (isValidElement(sidebar)) {
    sidebarContent = cloneElement(sidebar, { sidebarControls });
  }

  return (
    <>
      <aside
        className="hidden h-full min-h-0 overflow-y-auto border-r border-border bg-sidebar md:block"
        style={{ gridArea: "section" }}
      >
        {sidebarContent}
      </aside>

      {isSectionSidebarOpen && sidebarContent && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeSectionSidebar}
          />
          <div className="relative h-full w-72 overflow-y-auto bg-sidebar">
            <button
              aria-label="Cerrar panel"
              onClick={closeSectionSidebar}
              className="absolute right-2 top-2"
            />
            {sidebarContent}
          </div>
        </div>
      )}

      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-main"
        style={{ gridArea: "chat" }}
      >
        {children}
      </div>
    </>
  );
}
