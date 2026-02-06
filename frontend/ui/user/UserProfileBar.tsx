"use client";

import { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";
import { getMe, logout, User } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toBackendURL } from "@/lib/backend-client";

export default function UserProfileBar() {
  const router = useRouter();

  const [user, setUser] = useState<User>();
  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const fetchUser = async () => {
    return await getMe();
  };

  useEffect(() => {
    (async () => {
      try {
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    })();
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return null;

  const avatarSrc = user?.id
    ? toBackendURL(
        `/api/users/${user.id}/avatar?${encodeURIComponent(
          user.updatedAt?.toString?.() ?? "",
        )}`
      )
    : fallbackAvatar;

  return (
    <div className="flex h-[72px] items-center gap-3 border-t border-gray-700 bg-gray-800 px-3">
      {/* Avatar */}
      <img
        key={avatarSrc}
        src={avatarSrc}
        alt={user.username}
        className="w-10 h-10 rounded-full"
        onError={(e) => {
          e.currentTarget.src = fallbackAvatar;
        }}
      />

      {/* Username */}
      <div className="flex-1 truncate">
        <p className="text-sm font-semibold truncate">{user.username}</p>
        <p className="text-xs text-gray-400">{user.status}</p>
      </div>

      {/* Settings dropdown */}
      <Menu as="div" className="relative">
        <Menu.Button className="text-gray-400 hover:text-white transition">
          ⚙️
        </Menu.Button>

        <Menu.Items className="absolute right-0 bottom-10 w-40 bg-gray-700 rounded-md shadow-lg ring-1 ring-black/20 focus:outline-none">
          <div className="p-1 text-sm">
            {/* Edit Name */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setOpenNameModal(true)}
                  className={`w-full px-2 py-2 rounded-md ${
                    active ? "bg-gray-600 text-white" : "text-gray-200"
                  }`}
                >
                  Edit Name
                </button>
              )}
            </Menu.Item>

            {/* Edit Avatar */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setOpenAvatarModal(true)}
                  className={`w-full px-2 py-2 rounded-md ${
                    active ? "bg-gray-600 text-white" : "text-gray-200"
                  }`}
                >
                  Edit Avatar
                </button>
              )}
            </Menu.Item>

            {/* Logout */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`w-full px-2 py-2 rounded-md ${
                    active ? "bg-red-600 text-white" : "text-red-400"
                  }`}
                >
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Menu>

      {/* Modals */}
      {openNameModal && (
        <EditNameModal
          user={user}
          onClose={() => setOpenNameModal(false)}
          onUpdated={async () => {
            const updatedUser = await fetchUser();
            if (updatedUser) {
              setUser(updatedUser);
            }
          }}
        />
      )}
      {openAvatarModal && (
        <EditAvatarModal
          onClose={() => setOpenAvatarModal(false)}
        />
      )}
    </div>
  );
}
