"use client";

import { useState } from "react";
import { Member } from "@/lib/definitions";
import { UserPlus } from "lucide-react";

type Props = {
  members: Member[];
  allServerMembers: Member[];
  ownerId: string;
  disabled: boolean;
  assigningId?: string;
  onAssignMember: (member: Member) => void;
  onRemoveMember: (member: Member) => void;
};

export default function RoleMembersSection({
  members,
  allServerMembers,
  ownerId,
  disabled,
  assigningId,
  onAssignMember,
  onRemoveMember,
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Members not in this role and not the server owner
  const memberIds = new Set(members.map((m) => m.userId));
  const availableMembers = allServerMembers.filter(
    (m) => m.userId !== ownerId && !memberIds.has(m.userId),
  );

  function getInitial(member: Member): string {
    const name = member.user?.username ?? "?";
    return name.charAt(0).toUpperCase();
  }

  function getAvatarColor(index: number): string {
    const colors = [
      "bg-blue-700/70",
      "bg-purple-700/70",
      "bg-green-700/70",
      "bg-orange-700/70",
      "bg-pink-700/70",
      "bg-cyan-700/70",
    ];
    return colors[index % colors.length];
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Miembros ({members.length})
        </h4>

        {!disabled && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-gold transition-colors hover:bg-surface/80"
            >
              <UserPlus size={12} />
              Agregar miembro
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full z-10 mt-1 max-h-48 w-56 overflow-y-auto rounded-lg border border-border bg-main shadow-xl">
                {availableMembers.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-text-muted">
                    No hay miembros disponibles.
                  </p>
                ) : (
                  availableMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        onAssignMember(member);
                        setShowDropdown(false);
                      }}
                      disabled={assigningId === member.userId}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-text-body transition-colors hover:bg-surface/50 disabled:opacity-50"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getAvatarColor(0)}`}
                      >
                        {getInitial(member)}
                      </span>
                      {member.user?.username ?? "Usuario"}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member list */}
      <div className="space-y-1.5">
        {members.length === 0 ? (
          <p className="rounded-lg bg-surface/40 px-3 py-3 text-center text-xs text-text-muted">
            No hay miembros con este rol.
          </p>
        ) : (
          members.map((member, i) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg bg-surface/40 px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(i)}`}
                >
                  {getInitial(member)}
                </span>
                <span className="text-[13px] font-medium text-text-body">
                  {member.user?.username ?? "Usuario"}
                </span>
              </div>

              {!disabled && member.userId !== ownerId && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(member)}
                  disabled={assigningId === member.userId}
                  className="rounded px-2 py-1 text-[11px] font-medium text-ruby transition-colors hover:bg-ruby/10 disabled:opacity-50"
                >
                  Quitar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
