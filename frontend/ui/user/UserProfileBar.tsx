"use client";

import { useState } from "react";
import { Menu } from "@headlessui/react";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toBackendURL } from "@/lib/backend-client";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import UserAvatar from "./UserAvatar";
import LanguageToggle from "@/ui/common/LanguageToggle";

export default function UserProfileBar() {
  const { t } = useTranslation("user");
  const router = useRouter();

  const { currentUser: user, updateCurrentUser } = useCurrentUser();
  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return null;

  const dynamicUrl = toBackendURL(
    `/api/users/${user.id}/avatar?${encodeURIComponent(user.updatedAt?.toString?.() ?? "")}`
  );

  return (
    <div className="flex h-[var(--footer-height)] items-center gap-3 border-t border-border bg-deep px-3" data-tour="user-profile-bar">
      <UserAvatar src={dynamicUrl} username={user.username} userId={user.id} size={40} ring />

      <div className="flex-1 truncate">
        <p className="truncate text-sm font-semibold text-text-primary">{user.username}</p>
        <p className="text-xs text-text-muted">{user.status}</p>
      </div>

      <LanguageToggle />

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
                  {t('profile.editName')}
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
                  {t('profile.editAvatar')}
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
                  {t('profile.logout')}
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
          onUpdated={(updated) => updateCurrentUser(updated)}
        />
      )}
      {openAvatarModal && (
        <EditAvatarModal
          onClose={() => setOpenAvatarModal(false)}
          onUpdated={() => updateCurrentUser(user)}
        />
      )}
    </div>
  );
}