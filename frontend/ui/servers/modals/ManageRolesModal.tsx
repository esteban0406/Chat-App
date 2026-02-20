"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Server, Role } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";
import { useServerPermissions } from "@/lib/useServerPermissions";
import RoleSidebar from "./roles/RoleSidebar";
import RoleDetailPanel from "./roles/RoleDetailPanel";

type Props = {
  server: Server;
  onClose: () => void;
};

export default function ManageRolesModal({ server, onClose }: Props) {
  const { hasPermission, loading: permLoading } = useServerPermissions(server);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isCreatingRef = useRef(isCreating);
  useLayoutEffect(() => {
    isCreatingRef.current = isCreating;
  });

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await backendFetch(`/api/servers/${server.id}/roles`);
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "No se pudieron cargar los roles"),
        );
      }
      const data = await res.json();
      const rolesList: Role[] = Array.isArray(data) ? data : data.data ?? [];
      setRoles(rolesList);

      // Auto-select first role if none selected
      setSelectedRoleId((prev) =>
        !prev && !isCreatingRef.current && rolesList.length > 0
          ? rolesList[0].id
          : prev,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los roles",
      );
    } finally {
      setLoading(false);
    }
  }, [server.id]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  function handleSelectRole(roleId: string) {
    setSelectedRoleId(roleId);
    setIsCreating(false);
  }

  function handleCreateNew() {
    setIsCreating(true);
    setSelectedRoleId(null);
  }

  function handleSaved() {
    void loadRoles();
    if (isCreating) {
      setIsCreating(false);
    }
  }

  function handleDeleted() {
    setSelectedRoleId(null);
    void loadRoles();
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  // Permission denied
  if (!permLoading && !hasPermission("MANAGE_ROLES")) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-lg rounded-xl bg-deep p-6 text-white shadow-xl">
          <p className="mb-4 text-sm text-text-secondary">
            No tienes los permisos requeridos para esta acción.
          </p>
          <div className="text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface/80"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[80vh] max-h-[760px] w-full max-w-[920px] overflow-hidden rounded-xl border border-border bg-deep shadow-2xl">
        {/* Left Panel — Role Sidebar */}
        <RoleSidebar
          serverName={server.name}
          roles={roles}
          selectedRoleId={selectedRoleId}
          isCreating={isCreating}
          onSelectRole={handleSelectRole}
          onCreateNew={handleCreateNew}
          onClose={onClose}
        />

        {/* Right Panel — Role Detail */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-text-muted">Cargando roles...</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-ruby">{error}</p>
            </div>
          ) : (
            <RoleDetailPanel
              serverId={server.id}
              role={selectedRole}
              isCreating={isCreating}
              allServerMembers={server.members ?? []}
              ownerId={server.ownerId}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
