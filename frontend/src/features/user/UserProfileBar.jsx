import { useSelector, useDispatch } from "react-redux";
import { Menu } from "@headlessui/react";
import { useState } from "react";
import { logout, normalizeUser } from "../auth/authSlice";
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";
import { API_BASE_URL } from "../../services/api";

export default function UserProfileBar() {
  const rawUser = useSelector((state) => state.auth.user);
  const user = normalizeUser(rawUser);
  const dispatch = useDispatch();

  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  const usersBase = API_BASE_URL;
  const userId = user?.id || user?._id;
  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const avatarVersion = user?.updatedAt
    ? new Date(user.updatedAt).getTime()
    : 0;
  const avatarSrc = userId
    ? `${usersBase}/users/${userId}/avatar${
        avatarVersion ? `?v=${avatarVersion}` : ""
      }`
    : fallbackAvatar;

  return (
    <div className="flex h-20 w-full items-center gap-3 border-t border-gray-700 bg-gray-800 px-3">
      {/* Avatar */}
      <img
        key={avatarSrc}
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
          <Menu.Button className="text-gray-400 hover:text-white transition-colors">
            ⚙️
          </Menu.Button>
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
