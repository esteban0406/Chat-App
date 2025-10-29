import { useSelector } from "react-redux";

export default function UserProfileBar() {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="flex h-20 w-full items-center gap-3 border-t border-gray-700 bg-gray-800 px-3">
      {/* Avatar */}
      <img
        src={user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
        alt={user?.username}
        className="w-10 h-10 rounded-full"
      />

      {/* Nombre */}
      <div className="flex-1">
        <p className="text-sm font-semibold truncate">{user?.username}</p>
        <p className="text-xs text-gray-400">Online</p>
      </div>

      {/* Iconos (mute, ajustes, etc.) */}
      <div className="flex space-x-2">
        <button className="text-gray-400 hover:text-white">🎤</button>
        <button className="text-gray-400 hover:text-white">⚙️</button>
      </div>
    </div>
  );
}
