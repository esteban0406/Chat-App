"use client";

import { useState } from "react";
import { Menu } from "@headlessui/react";
import { Settings } from "lucide-react";
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toBackendURL } from "@/lib/backend-client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import Image from "next/image"; 

export default function UserProfileBar() {
  const router = useRouter();

  const { currentUser: user, refreshUser } = useCurrentUser();
  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  const fallbackAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return null;

  const dynamicUrl = toBackendURL(
    `/api/users/${user.id}/avatar?${encodeURIComponent(user.updatedAt?.toString?.() ?? "")}`
  );
  const avatarSrc = failedUrl === dynamicUrl ? fallbackAvatar : dynamicUrl;

  return (
    <div className="flex h-[var(--footer-height)] items-center gap-3 border-t border-border bg-deep px-3">
      <div className="relative h-10 w-10 shrink-0">
        <Image
          src={avatarSrc}
          alt={user.username || "User avatar"}
          fill
          unoptimized={process.env.NODE_ENV === 'development'}
          sizes="40px"
          className="rounded-full object-cover ring-2 ring-gold"
          onError={() => setFailedUrl(dynamicUrl)}
        />
      </div>

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
          onUpdated={() => refreshUser()}
        />
      )}
      {openAvatarModal && (
        <EditAvatarModal
          onClose={() => setOpenAvatarModal(false)}
          onUpdated={() => refreshUser()}
        />
      )}
    </div>
  );
}