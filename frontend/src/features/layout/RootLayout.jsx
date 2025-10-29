import { Outlet } from "react-router-dom";
import ServerSidebar from "../servers/ServerSidebar";
import UserProfileBar from "../user/UserProfileBar";

export default function RootLayout() {
  return (
    <div
      className="grid h-screen w-screen bg-gray-900 text-white"
      style={{
        gridTemplateColumns: "72px 240px minmax(0, 1fr)",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gridTemplateAreas: "'servers sectionSidebar chat' 'profile profile chat'",
      }}
    >
      <aside
        className="h-full border-r border-gray-700 bg-gray-800"
        style={{ gridArea: "servers" }}
      >
        <ServerSidebar />
      </aside>

      <Outlet />

      <div
        className="border-t border-gray-700 bg-gray-800"
        style={{ gridArea: "profile" }}
      >
        <UserProfileBar />
      </div>
    </div>
  );
}
