"use client";

import { useState } from "react";
import { Server, User } from "@/lib/definitions";

type Props = {
  server: Server;
  onClose: () => void;
  onMemberRemoved?: (memberID : string) => void;
};

export default function EditServerModal({
  server,
  onClose,
  onMemberRemoved,
}: Props) {
  const [removingId, setRemovingId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  const members: User[] = server.members;

  const handleRemove = async (member: User) => {
    setRemovingId(member.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/servers/${server.id}/members/${member.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error("Failed to remove member");
      }
      onMemberRemoved?.(member.id);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar al miembro");
    } finally {
      setRemovingId(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg bg-gray-800 p-6 text-white shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Miembros de {server.name}</h3>
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
              if (member.id != server.owner) {
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded bg-gray-700 px-3 py-2 text-sm"
                  >
                    <span>{`${member.username} (${member.email})`}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={removingId === member.id}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </div>
                );
              }
            })
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

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
