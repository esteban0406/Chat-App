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
  const { closeSectionSidebar } = useLayoutContext();

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

      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-main"
        style={{ gridArea: "chat" }}
      >
        {children}
      </div>
    </>
  );
}
