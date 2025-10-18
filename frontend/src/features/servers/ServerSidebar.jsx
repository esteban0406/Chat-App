import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchServers, selectServers } from "./serverSlice";

export default function ServerSidebar() {
  const dispatch = useDispatch();
  const servers = useSelector(selectServers);

  useEffect(() => {
    dispatch(fetchServers()); 
  }, [dispatch]);

  return (
    <aside className="w-20 bg-gray-800 flex flex-col items-center py-4 space-y-4">
      {/* Perfil (lleva a /me) */}
      <Link
        to="/me"
        className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold hover:bg-indigo-500 transition"
      >
        Me
      </Link>

      <div className="border-t border-gray-700 w-10" />

      {/* Lista de servidores */}
      {servers.map((server) => (
        <Link
          key={server._id}
          to={`/servers/${server._id}`}
          className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition"
        >
          {server.name[0].toUpperCase()}
        </Link>
      ))}
    </aside>
  );
}
