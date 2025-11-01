import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import {
  Bars3Icon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export function FriendsSidebar({ sidebarControls = {} }) {
  const closeSidebar = sidebarControls.closeSidebar;
  return (
    <div className="h-full w-full space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Amigos</h2>
        {closeSidebar && (
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400">
        Administra tu lista de amigos e invitaciones
      </p>
    </div>
  );
}

export default function FriendsLayout() {
  const layoutContext = useOutletContext() ?? {};
  const {
    openServerDrawer = () => {},
    openSectionSidebar = () => {},
    openProfileDrawer = () => {},
  } = layoutContext;
  const linkClass = ({ isActive }) =>
    `whitespace-nowrap pb-2 ${
      isActive
        ? "border-b-2 border-indigo-500 text-indigo-400"
        : "text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openServerDrawer}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Abrir servidores"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">Amigos</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSectionSidebar}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Abrir menú de amigos"
            >
              <UsersIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={openProfileDrawer}
              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Abrir perfil"
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-nowrap gap-6 overflow-x-auto px-4 pb-3 pt-1 text-sm font-medium text-gray-400 md:px-6 md:py-4">
          <NavLink
            end
            to="/friends"
            className={linkClass}
          >
            Todos
          </NavLink>
          <NavLink
            to="/friends/add"
            className={linkClass}
          >
            Agregar amigos
          </NavLink>
          <NavLink
            to="/friends/requests"
            className={linkClass}
          >
            Solicitudes de amistad
          </NavLink>
          <NavLink
            to="/friends/server-requests"
            className={linkClass}
          >
            Solicitudes a servidores
          </NavLink>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <Outlet context={layoutContext} />
      </div>
    </div>
  );
}
