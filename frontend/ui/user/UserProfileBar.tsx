"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu } from "@headlessui/react";
import EditNameModal from "./modals/EditNameModal";
import EditAvatarModal from "./modals/EditAvatarModal";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { User } from "@/lib/definitions";
import { Session } from "@/lib/auth-client";

function resolveSessionUser(session: Session): User | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const payload =
    "data" in session
      ? (session as Session).data
      : session;

  const source = (payload as Session)?.session?.data?.user;

  if (!source) {
    return null;
  }

  const now = new Date().toISOString();
  const usernameCandidate =
    source.username ??
    source.name ??
    source.email ??
    "Usuario";

  return {
    id: source.id ?? source._id ?? source.userId ?? "",
    username: usernameCandidate,
    email: source.email ?? "",
    avatar: source.avatar ?? undefined,
    provider: (source.provider as User["provider"]) ?? "local",
    status: (source.status as User["status"]) ?? "online",
    createdAt: source.createdAt ?? now,
    updatedAt: source.updatedAt ?? now,
  };
}

export default function UserProfileBar() {
  const router = useRouter();

  const [user, setUser] = useState<User>(null);
  const [openNameModal, setOpenNameModal] = useState(false);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);

  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const fetchCurrentUser = useCallback(async () => {
    const session = await authClient.getSession();
    return resolveSessionUser(session);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const resolved = await fetchCurrentUser();
      setUser(resolved);
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      setUser(null);
    }
  }, [fetchCurrentUser]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const resolved = await fetchCurrentUser();
        if (!cancelled) {
          setUser(resolved);
        }
      } catch (error) {
        console.error("❌ Error loading user profile:", error);
        if (!cancelled) {
          setUser(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchCurrentUser]);

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
        alt={user.username}
        className="w-10 h-10 rounded-full"
        onError={(e) => {
          e.currentTarget.src = fallbackAvatar;
        }}
      />

      {/* Username */}
      <div className="flex-1 truncate">
        <p className="text-sm font-semibold truncate">{user.username}</p>
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
          onUpdated={refreshUser}
        />
      )}
      {openAvatarModal && (
        <EditAvatarModal
          user ={user}
          onClose={() => setOpenAvatarModal(false)}
          onUpdated={refreshUser}
        />
      )}
    </div>
  );
}
