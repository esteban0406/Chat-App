"use client";

import { useState } from "react";
import { Server, Member } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  server: Server;
  onClose: () => void;
  onMemberRemoved?: (memberID: string) => void;
};

export default function EditServerModal({
  server,
  onClose,
  onMemberRemoved,
}: Props) {
  const [removingId, setRemovingId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  const members: Member[] = server.members ?? [];

  const handleRemove = async (member: Member) => {
    setRemovingId(member.id);
    setError(null);
    try {
      const res = await backendFetch(
        `/api/servers/${server.id}/members/${member.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "Failed to remove member");
        throw new Error(msg);
      }
      onMemberRemoved?.(member.id);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo eliminar al miembro";
      setError(message);
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
              if (member.userId !== server.ownerId) {
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded bg-gray-700 px-3 py-2 text-sm"
                  >
                    <span>{`${member.user?.username ?? "Usuario"} (${member.user?.email ?? ""})`}</span>
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
              return null;
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
