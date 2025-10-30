import { useSelector, useDispatch } from "react-redux";
import { Menu } from "@headlessui/react";
import { useState } from "react";
import { logout } from "../auth/authSlice"; 
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";

export default function UserProfileBar() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  const rawApiBase = import.meta.env.VITE_API_URL || "/api";
  const trimmedApiBase = rawApiBase.replace(/\/$/, "");
  const usersBase = trimmedApiBase.endsWith("/api")
    ? trimmedApiBase
    : `${trimmedApiBase}/api`;
  const userId = user?.id || user?._id;
  const fallbackAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const avatarSrc = userId
    ? `${usersBase}/users/${userId}/avatar`
    : fallbackAvatar;

  return (
    <div className="flex h-20 w-full items-center gap-3 border-t border-gray-700 bg-gray-800 px-3">
      {/* Avatar */}
      <img
        src={avatarSrc}
        alt={user?.username}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackAvatar;
        }}
        className="w-10 h-10 rounded-full"
      />

      {/* Username */}
      <div className="flex-1">
        <p className="text-sm font-semibold truncate">{user?.username}</p>
        <p className="text-xs text-gray-400">Online</p>
      </div>

      {/* Buttons */}
      <div className="flex space-x-2">

        {/* Settings dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="text-gray-400 hover:text-white transition-colors">⚙️</Menu.Button>
          <Menu.Items className="absolute right-0 bottom-10 w-40 bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="p-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setOpenNameModal(true)}
                    className={`${
                      active ? "bg-gray-600 text-white" : "text-gray-200"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    Edit Name
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setOpenAvatarModal(true)}
                    className={`${
                      active ? "bg-gray-600 text-white" : "text-gray-200"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    Edit Avatar
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => dispatch(logout())}
                    className={`${
                      active ? "bg-red-600 text-white" : "text-red-400"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>

      {/* Modals */}
      <EditNameModal open={openNameModal} setOpen={setOpenNameModal} />
      <EditAvatarModal open={openAvatarModal} setOpen={setOpenAvatarModal} />
    </div>
  );
}
