"use client";

import { Switch } from "@headlessui/react";
import { ServerPermission } from "@/lib/definitions";

const PERMISSION_LABELS: Record<ServerPermission, string> = {
  CREATE_CHANNEL: "Crear canal",
  DELETE_CHANNEL: "Eliminar canal",
  DELETE_SERVER: "Eliminar servidor",
  INVITE_MEMBER: "Invitar miembros",
  REMOVE_MEMBER: "Eliminar miembros",
  MANAGE_ROLES: "Gestionar roles",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as ServerPermission[];

type Props = {
  permissions: ServerPermission[];
  disabled: boolean;
  onToggle: (perm: ServerPermission) => void;
};

export default function RolePermissionsSection({
  permissions,
  disabled,
  onToggle,
}: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Permisos
      </h4>

      <div className="space-y-1.5">
        {ALL_PERMISSIONS.map((perm) => {
          const enabled = permissions.includes(perm);
          return (
            <div
              key={perm}
              className="flex items-center justify-between rounded-lg bg-surface/40 px-3 py-2.5"
            >
              <span className="text-[13px] text-text-body">
                {PERMISSION_LABELS[perm]}
              </span>
              <Switch
                checked={enabled}
                onChange={() => onToggle(perm)}
                disabled={disabled}
                className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-deep disabled:opacity-50 ${
                  enabled ? "bg-gold" : "bg-surface"
                }`}
              >
                <span
                  className={`inline-block h-[18px] w-[18px] rounded-full transition-transform ${
                    enabled
                      ? "translate-x-5 bg-white"
                      : "translate-x-0.5 bg-text-muted"
                  }`}
                />
              </Switch>
            </div>
          );
        })}
      </div>
    </div>
  );
}
