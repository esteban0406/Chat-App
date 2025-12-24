"use client";

import { useState } from "react";
import { Server, User } from "@/lib/definitions";

type Props = {
  server: Server | null;
  onClose: () => void;
  onMemberRemoved?: (memberId: string) => void;
};

const toUserId = (member: User | string) =>
  typeof member === "string" ? member : member.id;

export default function EditServerModal({
  server,
  onClose,
  onMemberRemoved,
}: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  const members = Array.isArray(server.members)
    ? server.members
    : [];

  const handleRemove = async (member: User | string) => {
    const memberId = toUserId(member);
    if (!memberId) return;

    setRemovingId(memberId);
    setError(null);
    try {
      const res = await fetch(
        `/api/servers/${server.id}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error("Failed to remove member");
      }
      onMemberRemoved?.(memberId);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar al miembro");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg bg-gray-800 p-6 text-white shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            Miembros de {server.name}
          </h3>
          <p className="text-sm text-gray-400">
            Elimina miembros del servidor.
          </p>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">
              No hay miembros registrados.
            </p>
          ) : (
            members.map((member) => {
              const memberId = toUserId(member);
              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between rounded bg-gray-700 px-3 py-2 text-sm"
                >
                  <span>
                    {typeof member === "string"
                      ? member
                      : `${member.username} (${member.email})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={removingId === memberId}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {removingId === memberId ? "..." : "Eliminar"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-4 text-right">
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
