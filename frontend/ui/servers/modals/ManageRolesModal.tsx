"use client";

import { useEffect, useState } from "react";
import { Server, Role, Member, ServerPermission } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";
import { useServerPermissions } from "@/lib/useServerPermissions";

type Props = {
  server: Server;
  onClose: () => void;
};

const PERMISSION_LABELS: Record<ServerPermission, string> = {
  CREATE_CHANNEL: "Crear canal",
  DELETE_CHANNEL: "Eliminar canal",
  DELETE_SERVER: "Eliminar servidor",
  INVITE_MEMBER: "Invitar miembros",
  REMOVE_MEMBER: "Eliminar miembros",
  MANAGE_ROLES: "Gestionar roles",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as ServerPermission[];
const DEFAULT_ROLE_NAMES = ["Admin", "Member"];

export default function ManageRolesModal({ server, onClose }: Props) {
  const { hasPermission, loading: permLoading } = useServerPermissions(server);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [view, setView] = useState<"list" | "form" | "assign">("list");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [formPermissions, setFormPermissions] = useState<ServerPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();

  // Assign state — track local role overrides so UI updates immediately
  const [memberRoles, setMemberRoles] = useState<Record<string, string | undefined>>({});
  const [assigningId, setAssigningId] = useState<string>();

  useEffect(() => {
    loadRoles();
  }, [server.id]);

  async function loadRoles() {
    try {
      setLoading(true);
      const res = await backendFetch(`/api/servers/${server.id}/roles`);
      if (!res.ok) {
        const msg = await extractErrorMessage(
          res,
          "No se pudieron cargar los roles",
        );
        throw new Error(msg);
      }
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "No se pudieron cargar los roles";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingRole(null);
    setFormName("");
    setFormColor("#6366f1");
    setFormPermissions([]);
    setError(null);
    setView("form");
  }

  function openEditForm(role: Role) {
    setEditingRole(role);
    setFormName(role.name);
    setFormColor(role.color || "#6366f1");
    setFormPermissions([...role.permissions]);
    setError(null);
    setView("form");
  }

  function togglePermission(perm: ServerPermission) {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: formName,
        color: formColor,
        permissions: formPermissions,
      };

      const url = editingRole
        ? `/api/servers/${server.id}/roles/${editingRole.id}`
        : `/api/servers/${server.id}/roles`;

      const res = await backendFetch(url, {
        method: editingRole ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(
          res,
          "No se pudo guardar el rol",
        );
        throw new Error(msg);
      }

      await loadRoles();
      setView("list");
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "No se pudo guardar el rol";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: Role) {
    setDeletingId(role.id);
    setError(null);

    try {
      const res = await backendFetch(
        `/api/servers/${server.id}/roles/${role.id}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const msg = await extractErrorMessage(
          res,
          "No se pudo eliminar el rol",
        );
        throw new Error(msg);
      }

      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el rol";
      setError(message);
    } finally {
      setDeletingId(undefined);
    }
  }

  async function handleAssignRole(member: Member, roleId: string) {
    setAssigningId(member.userId);
    setError(null);

    try {
      const res = await backendFetch(
        `/api/servers/${server.id}/roles/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.userId, roleId }),
        },
      );

      if (!res.ok) {
        const msg = await extractErrorMessage(
          res,
          "No se pudo asignar el rol",
        );
        throw new Error(msg);
      }

      setMemberRoles((prev) => ({ ...prev, [member.userId]: roleId }));
      await loadRoles();
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "No se pudo asignar el rol";
      setError(message);
    } finally {
      setAssigningId(undefined);
    }
  }

  function getMemberRoleId(member: Member): string | undefined {
    return memberRoles[member.userId] ?? member.roleId;
  }

  const isDefault = (role: Role) => DEFAULT_ROLE_NAMES.includes(role.name);

  if (!permLoading && !hasPermission("MANAGE_ROLES")) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-lg rounded-lg bg-gray-800 p-6 text-white shadow-xl">
          <p className="mb-4 text-sm text-gray-300">
            No tienes los permisos requeridos para esta acción.
          </p>
          <div className="text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-500"
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
      <div className="w-full max-w-lg rounded-lg bg-gray-800 p-6 text-white shadow-xl">
        {view === "assign" ? (
          <>
            {/* Assign view */}
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setError(null);
                }}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">Asignar Roles</h3>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
              {(server.members ?? []).filter((m) => m.userId !== server.ownerId).length === 0 ? (
                <p className="text-sm text-gray-400">No hay miembros.</p>
              ) : (
                (server.members ?? [])
                  .filter((m) => m.userId !== server.ownerId)
                  .map((member: Member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded bg-gray-700 px-3 py-2 text-sm"
                  >
                    <span>{member.user?.username ?? "Usuario"}</span>
                    <select
                      value={getMemberRoleId(member) ?? ""}
                      onChange={(e) => handleAssignRole(member, e.target.value)}
                      disabled={assigningId === member.userId}
                      className="rounded bg-gray-600 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Sin rol
                      </option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setError(null);
                }}
                className="rounded bg-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-500"
              >
                Volver
              </button>
            </div>
          </>
        ) : view === "list" ? (
          <>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Gestionar Roles</h3>
                <p className="text-sm text-gray-400">{server.name}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Create button */}
            <button
              type="button"
              onClick={openCreateForm}
              className="mb-4 w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
            >
              + Crear rol
            </button>

            {/* Roles list */}
            <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-gray-400">Cargando roles...</p>
              ) : roles.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No hay roles disponibles.
                </p>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded bg-gray-700 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: role.color || "#9ca3af" }}
                      />
                      <span className="font-medium">{role.name}</span>
                      {role._count && (
                        <span className="text-xs text-gray-400">
                          ({role._count.members}{" "}
                          {role._count.members === 1 ? "miembro" : "miembros"})
                        </span>
                      )}
                      {isDefault(role) && (
                        <span className="rounded bg-gray-600 px-1.5 py-0.5 text-xs text-gray-300">
                          Por defecto
                        </span>
                      )}
                    </div>

                    {!isDefault(role) && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(role)}
                          className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-600 hover:text-white"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(role)}
                          disabled={deletingId === role.id}
                          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-gray-600 hover:text-red-300 disabled:opacity-60"
                        >
                          {deletingId === role.id ? "..." : "🗑"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            {/* Footer */}
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView("assign");
                }}
                className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-600"
              >
                Asignar roles
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-500"
              >
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Form view */}
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  setError(null);
                }}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {editingRole ? "Editar Rol" : "Crear Rol"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-300">
                  Nombre del rol
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Moderador"
                  className="w-full rounded bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-300">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-28 rounded bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Permisos
                </label>
                <div className="space-y-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className="flex cursor-pointer items-center gap-2 rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={formPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>{PERMISSION_LABELS[perm]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("list");
                    setError(null);
                  }}
                  className="rounded bg-gray-600 px-4 py-2 text-sm hover:bg-gray-500"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
