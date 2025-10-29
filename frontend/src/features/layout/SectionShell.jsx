import { isValidElement } from "react";
import { Outlet } from "react-router-dom";

export default function SectionShell({ sidebar }) {
  const SidebarComponent = typeof sidebar === "function" ? sidebar : undefined;

  return (
    <>
      <aside
        className="h-full border-r border-gray-700 bg-gray-800 min-h-0 overflow-y-auto"
        style={{ gridArea: "sectionSidebar" }}
      >
        {SidebarComponent ? (
          <SidebarComponent />
        ) : isValidElement(sidebar) ? (
          sidebar
        ) : null}
      </aside>

      <div
        className="h-full min-h-0 overflow-hidden bg-gray-900"
        style={{ gridArea: "chat" }}
      >
        <Outlet />
      </div>
    </>
  );
}
