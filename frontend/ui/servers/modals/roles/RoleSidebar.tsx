"use client";

import { Role } from "@/lib/definitions";
import { Plus, X } from "lucide-react";
import RoleSidebarItem from "./RoleSidebarItem";

type Props = {
  serverName: string;
  roles: Role[];
  selectedRoleId: string | null;
  isCreating: boolean;
  onSelectRole: (roleId: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
};

export default function RoleSidebar({
  serverName,
  roles,
  selectedRoleId,
  isCreating,
  onSelectRole,
  onCreateNew,
  onClose,
}: Props) {
  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="px-4 pb-2 pt-4">
        <h3 className="font-display text-xl font-semibold text-white">Roles</h3>
        <p className="text-xs text-text-muted">{serverName}</p>
      </div>

      {/* Create button */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={onCreateNew}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-semibold transition-colors ${
            isCreating
              ? "bg-gold/80 text-deep"
              : "bg-gold text-deep hover:bg-gold/90"
          }`}
        >
          <Plus size={14} />
          Crear rol
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 my-1 h-px bg-border" />

      {/* Role list */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {roles.map((role) => (
          <RoleSidebarItem
            key={role.id}
            role={role}
            isSelected={!isCreating && selectedRoleId === role.id}
            onSelect={() => onSelectRole(role.id)}
          />
        ))}
      </div>

      {/* Close button */}
      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-surface py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface/80 hover:text-white"
        >
          <X size={14} />
          Cerrar
        </button>
      </div>
    </div>
  );
}
