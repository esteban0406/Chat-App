"use client";

import { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { User } from "@/lib/definitions";

export default function UserProfileBar() {
  const router = useRouter();

  const [user, setUser] = useState<User>();
  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const fetchUser = async () => {
    const session = await authClient.getSession();
    return session.data?.user;
  };

  useEffect(() => {
    (async () => {
      try {
        setUser(await fetchUser());
      } catch (error) {
        console.error("❌ Error loading user profile:", error);
      }
    })();
  }, []);

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  if (!user) return null;

  const avatarSrc = user?.id
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.id}/avatar?${user.updatedAt}`
    : fallbackAvatar;

  return (
    <div className="flex h-[72px] items-center gap-3 border-t border-gray-700 bg-gray-800 px-3">
      {/* Avatar */}
      <img
        key={avatarSrc}
        src={avatarSrc}
        alt={user.name}
        className="w-10 h-10 rounded-full"
        onError={(e) => {
          e.currentTarget.src = fallbackAvatar;
        }}
      />

      {/* Username */}
      <div className="flex-1 truncate">
        <p className="text-sm font-semibold truncate">{user.name}</p>
        <p className="text-xs text-gray-400">Online</p>
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
            setUser(updatedUser);
          }}
        />
      )}
      {openAvatarModal && (
        <EditAvatarModal
          onClose={() => setOpenAvatarModal(false)}
          //onUpdated={refreshUser}
        />
      )}
    </div>
  );
}
