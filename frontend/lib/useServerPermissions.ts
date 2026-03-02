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
      if (loading || !userId || !server?.members) return false;
      if (server.ownerId === userId) return true;

      const member = server.members.find((m) => m.userId === userId);
      if (!member) return false;

      if (!member.role) return false;

      return member.role.permissions.includes(perm);
    },
    [loading, userId, server],
  );

  return { hasPermission, isOwner, loading };
}
