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
        className="hidden h-full min-h-0 overflow-y-auto border-r border-gray-700 bg-gray-800 md:block"
        style={{ gridArea: "section" }}
      >
        {sidebarContent}
      </aside>

      {isSectionSidebarOpen && sidebarContent && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={closeSectionSidebar}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 h-full w-72 max-w-[80%] overflow-y-auto bg-gray-800 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-900"
        style={{ gridArea: "chat" }}
      >
        {children}
      </div>
    </>
  );
}
