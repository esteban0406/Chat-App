"use client";

import { useState, useEffect } from "react";
import { Role, Member, ServerPermission } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";
import { Trash2, Shield } from "lucide-react";
import RoleSettingsSection from "./RoleSettingsSection";
import RolePermissionsSection from "./RolePermissionsSection";
import RoleMembersSection from "./RoleMembersSection";

const DEFAULT_ROLE_NAMES = ["Admin", "Member"];

type Props = {
  serverId: string;
  role: Role | null;
  isCreating: boolean;
  allServerMembers: Member[];
  ownerId: string;
  onSaved: () => void;
  onDeleted: () => void;
};

export default function RoleDetailPanel({
  serverId,
  role,
  isCreating,
  allServerMembers,
  ownerId,
  onSaved,
  onDeleted,
}: Props) {
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formPermissions, setFormPermissions] = useState<ServerPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assigningId, setAssigningId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const isDefault = role ? DEFAULT_ROLE_NAMES.includes(role.name) : false;
  const disabled = isDefault;

  // Sync form state when selected role changes
  useEffect(() => {
    if (isCreating) {
      setFormName("");
      setFormColor("#6366f1");
      setFormPermissions([]);
    } else if (role) {
      setFormName(role.name);
      setFormColor(role.color || "#6366f1");
      setFormPermissions([...role.permissions]);
    }
    setError(null);
    setConfirmDelete(false);
  }, [role, isCreating]);

  function togglePermission(perm: ServerPermission) {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: formName,
        color: formColor,
        permissions: formPermissions,
      };

      const url = isCreating
        ? `/api/servers/${serverId}/roles`
        : `/api/servers/${serverId}/roles/${role!.id}`;

      const res = await backendFetch(url, {
        method: isCreating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "No se pudo guardar el rol"),
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el rol",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!role || isDefault) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await backendFetch(
        `/api/servers/${serverId}/roles/${role.id}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "No se pudo eliminar el rol"),
        );
      }

      onDeleted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar el rol",
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleAssignMember(member: Member) {
    if (!role) return;
    setAssigningId(member.userId);
    setError(null);

    try {
      const res = await backendFetch(
        `/api/servers/${serverId}/roles/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.userId, roleId: role.id }),
        },
      );

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "No se pudo asignar el rol"),
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo asignar el rol",
      );
    } finally {
      setAssigningId(undefined);
    }
  }

  async function handleRemoveMember(member: Member) {
    // Reassign the member to the "Member" default role
    setAssigningId(member.userId);
    setError(null);

    try {
      // Find the "Member" default role from server members' roles
      // We need to fetch roles to find the default one
      const rolesRes = await backendFetch(`/api/servers/${serverId}/roles`);
      if (!rolesRes.ok) throw new Error("No se pudieron cargar los roles");

      const roles: Role[] = await rolesRes.json();
      const memberRole = roles.find((r) => r.name === "Member");
      if (!memberRole) throw new Error("No se encontró el rol Member");

      const res = await backendFetch(
        `/api/servers/${serverId}/roles/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: member.userId,
            roleId: memberRole.id,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, "No se pudo quitar el miembro"),
        );
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo quitar el miembro",
      );
    } finally {
      setAssigningId(undefined);
    }
  }

  // Empty state — no role selected
  if (!role && !isCreating) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-text-muted">
        <Shield size={48} strokeWidth={1.5} className="mb-3 opacity-40" />
        <p className="text-sm">Selecciona un rol o crea uno nuevo</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2.5">
          {!isCreating && role && (
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: role.color || "#8B95A8" }}
            />
          )}
          <h3 className="font-display text-xl font-semibold text-white">
            {isCreating ? "Nuevo Rol" : role?.name}
          </h3>
        </div>

        {!isCreating && !isDefault && role && (
          <button
            type="button"
            onClick={() =>
              confirmDelete ? handleDelete() : setConfirmDelete(true)
            }
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-ruby transition-colors hover:bg-ruby/10 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {confirmDelete
              ? deleting
                ? "Eliminando..."
                : "Confirmar"
              : "Eliminar"}
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <RoleSettingsSection
          name={formName}
          color={formColor}
          disabled={disabled}
          onNameChange={setFormName}
          onColorChange={setFormColor}
        />

        <div className="h-px bg-border" />

        <RolePermissionsSection
          permissions={formPermissions}
          disabled={disabled}
          onToggle={togglePermission}
        />

        {/* Members section — only for existing roles */}
        {!isCreating && role && (
          <>
            <div className="h-px bg-border" />
            <RoleMembersSection
              members={role.members ?? []}
              allServerMembers={allServerMembers}
              ownerId={ownerId}
              disabled={disabled}
              assigningId={assigningId}
              onAssignMember={handleAssignMember}
              onRemoveMember={handleRemoveMember}
            />
          </>
        )}

        {error ? <p className="text-sm text-ruby">{error}</p> : null}
      </div>

      {/* Footer */}
      {!disabled && (
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => {
              if (role) {
                setFormName(role.name);
                setFormColor(role.color || "#6366f1");
                setFormPermissions([...role.permissions]);
              }
              setError(null);
            }}
            disabled={saving}
            className="rounded-md bg-surface px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface/80"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !formName.trim()}
            className="rounded-md bg-gold px-4 py-2 text-[13px] font-semibold text-deep transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </form>
  );
}
