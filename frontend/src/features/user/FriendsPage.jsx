import { NavLink, Outlet } from "react-router-dom";

export default function FriendsPage() {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h2 className="text-gray-300 font-semibold mb-4">Amigos</h2>
        <p className="text-gray-400 text-sm">
          Administra tu lista de amigos e invitaciones
        </p>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col bg-gray-900 p-6 overflow-y-auto">
        {/* Tabs */}
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

        {/* Sub-rutas */}
        <Outlet />
      </main>
    </div>
  );
}
