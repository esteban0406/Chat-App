import { NavLink, Outlet } from "react-router-dom";

export function FriendsSidebar() {
  return (
    <div className="h-full w-full p-4">
      <h2 className="text-gray-300 font-semibold mb-4">Amigos</h2>
      <p className="text-gray-400 text-sm mb-4">
        Administra tu lista de amigos e invitaciones
      </p>
    </div>
  );
}

export default function FriendsLayout() {
  return (
    <div className="flex h-full flex-col bg-gray-900 p-6 overflow-y-auto">
      <div className="flex space-x-6 border-b border-gray-700 mb-6">
        <NavLink
          end
          to="/friends"
          className={({ isActive }) =>
            `pb-2 ${
              isActive
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-gray-400 hover:text-gray-200"
            }`
          }
        >
          Todos
        </NavLink>
        <NavLink
          to="/friends/add"
          className={({ isActive }) =>
            `pb-2 ${
              isActive
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-gray-400 hover:text-gray-200"
            }`
          }
        >
          Agregar amigos
        </NavLink>
        <NavLink
          to="/friends/requests"
          className={({ isActive }) =>
            `pb-2 ${
              isActive
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-gray-400 hover:text-gray-200"
            }`
          }
        >
          Solicitudes de amistad
        </NavLink>
        <NavLink
          to="/friends/server-requests"
          className={({ isActive }) =>
            `pb-2 ${
              isActive
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-gray-400 hover:text-gray-200"
            }`
          }
        >
          Solicitudes a servidores
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
