"use client";

import { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import { Settings } from "lucide-react";
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
    <div className="flex h-[var(--footer-height)] items-center gap-3 border-t border-border bg-deep px-3">
      <img
        key={avatarSrc}
        src={avatarSrc}
        alt={user.username}
        className="h-10 w-10 rounded-full ring-2 ring-gold"
        onError={(e) => {
          e.currentTarget.src = fallbackAvatar;
        }}
      />

      <div className="flex-1 truncate">
        <p className="truncate text-sm font-semibold text-text-primary">{user.username}</p>
        <p className="text-xs text-text-muted">{user.status}</p>
      </div>

      <Menu as="div" className="relative">
        <Menu.Button className="rounded-md p-1.5 text-text-secondary transition hover:text-text-primary">
          <Settings className="h-4 w-4" />
        </Menu.Button>

        <Menu.Items className="absolute right-0 bottom-10 w-40 rounded-md bg-surface text-sm shadow-lg ring-1 ring-black/20 focus:outline-none">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setOpenNameModal(true)}
                  className={`w-full rounded-md px-2 py-2 text-left ${
                    active ? "bg-surface/80 text-white" : "text-text-secondary"
                  }`}
                >
                  Editar nombre
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setOpenAvatarModal(true)}
                  className={`w-full rounded-md px-2 py-2 text-left ${
                    active ? "bg-surface/80 text-white" : "text-text-secondary"
                  }`}
                >
                  Editar avatar
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`w-full rounded-md px-2 py-2 text-left ${
                    active ? "bg-ruby text-white" : "text-ruby"
                  }`}
                >
                  Cerrar sesión
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Menu>

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
          onUpdated={async () => {
            const updatedUser = await fetchUser();
            if (updatedUser) {
              setUser(updatedUser);
            }
          }}
        />
      )}
    </div>
  );
}
