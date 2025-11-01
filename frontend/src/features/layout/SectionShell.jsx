import { cloneElement, isValidElement } from "react";
import { Outlet, useOutletContext } from "react-router-dom";

export default function SectionShell({ sidebar }) {
  const SidebarComponent = typeof sidebar === "function" ? sidebar : undefined;
  const layoutContext = useLayoutContext();
  const {
    isSectionSidebarOpen = false,
    closeSectionSidebar = () => {},
  } = layoutContext;

  const sidebarControls = {
    closeSidebar: closeSectionSidebar,
  };

  const sidebarContent = SidebarComponent ? (
    <SidebarComponent sidebarControls={sidebarControls} />
  ) : isValidElement(sidebar) ? (
    cloneElement(sidebar, { sidebarControls })
  ) : null;

  return (
    <>
      <aside
        className="hidden h-full min-h-0 overflow-y-auto border-r border-gray-700 bg-gray-800 md:block"
        style={{ gridArea: "sectionSidebar" }}
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
        <Outlet context={layoutContext} />
      </div>
    </>
  );
}

function useLayoutContext() {
  try {
    return useOutletContext() ?? {};
  } catch {
    return {};
  }
}
