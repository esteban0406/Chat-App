"use client";

import { useLayoutContext } from "../layout";

export default function SectionShell({ children, sidebar }) {
  const { isSectionSidebarOpen, closeSectionSidebar } = useLayoutContext();

  const SidebarComponent =
    typeof sidebar === "function" ? sidebar : () => sidebar;

  return (
    <>
      {/* Desktop left section sidebar */}
      <aside
        style={{ gridArea: "sectionSidebar" }}
        className="hidden md:block h-full min-h-0 overflow-y-auto border-r border-gray-700 bg-gray-800"
      >
        <SidebarComponent sidebarControls={{ closeSidebar: closeSectionSidebar }} />
      </aside>

      {/* Mobile Drawer */}
      {isSectionSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            onClick={closeSectionSidebar}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 h-full w-72 overflow-y-auto bg-gray-800 shadow-xl">
            <SidebarComponent sidebarControls={{ closeSidebar: closeSectionSidebar }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-900">
        {children}
      </div>
    </>
  );
}
