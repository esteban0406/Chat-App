"use client";

import { useCallback } from "react";
import { useCurrentUser } from "@/lib/context/CurrentUserContext";
import { Server, ServerPermission } from "@/lib/definitions";

export function useServerPermissions(server: Server | undefined) {
  const { currentUser, loading } = useCurrentUser();
  const userId = currentUser?.id ?? null;

  const isOwner = !!(userId && server && server.ownerId === userId);

  const hasPermission = useCallback(
    (perm: ServerPermission): boolean => {
      // Permissive while data is loading — backend guard enforces real security
      if (loading || !userId || !server?.members) return true;
      if (server.ownerId === userId) return true;

      const member = server.members.find((m) => m.userId === userId);
      if (!member) return false;

      // If role data isn't available yet, allow (backend is the authority)
      if (!member.role) return true;

      return member.role.permissions.includes(perm);
    },
    [loading, userId, server],
  );

  return { hasPermission, isOwner, loading };
}
