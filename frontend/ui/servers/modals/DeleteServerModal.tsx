"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Server } from "@/lib/definitions";

type Props = {
  server: Server | null;
  onClose: () => void;
  onDeleted?: () => void;
};

export default function DeleteServerModal({
  server,
  onClose,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${server.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete server");
      }
      onDeleted?.();
      onClose();
      router.push("/friends");
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 text-white shadow-xl">
        <h3 className="text-lg font-semibold mb-3">
          Eliminar servidor
        </h3>
        <p className="text-sm text-gray-300">
          ¿Seguro que deseas eliminar{" "}
          <span className="font-semibold text-white">{server.name}</span>?
          Esta acción no se puede deshacer.
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded bg-gray-600 px-4 py-2 font-semibold hover:bg-gray-500 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded bg-red-600 px-4 py-2 font-semibold hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
