import { Outlet } from "react-router-dom";
import ServerSidebar from "../servers/ServerSidebar";

export default function RootLayout() {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {/* Sidebar de servidores siempre visible */}
      <ServerSidebar />

      {/* Área principal (FriendsPage o ServerLayout se cargan aquí) */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
