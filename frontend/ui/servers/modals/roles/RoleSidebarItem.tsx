"use client";

import { Role } from "@/lib/definitions";

const DEFAULT_ROLE_NAMES = ["Admin", "Member"];

type Props = {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
};

export default function RoleSidebarItem({ role, isSelected, onSelect }: Props) {
  const isDefault = DEFAULT_ROLE_NAMES.includes(role.name);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
        isSelected
          ? "border-l-2 border-gold bg-surface text-white"
          : "text-text-secondary hover:bg-surface/50 hover:text-white"
      }`}
    >
      <span
        className="inline-block h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: role.color || "#8B95A8" }}
      />
      <span className={`truncate text-[13px] ${isSelected ? "font-semibold" : "font-medium"}`}>
        {role.name}
      </span>
      {role._count && (
        <span className="text-[11px] text-text-muted">({role._count.members})</span>
      )}
      {isDefault && (
        <span className="ml-auto shrink-0 rounded bg-glass px-1.5 py-0.5 text-[9px] font-medium text-text-muted">
          Por defecto
        </span>
      )}
    </button>
  );
}
