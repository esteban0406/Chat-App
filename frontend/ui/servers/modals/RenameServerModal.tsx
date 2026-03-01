"use client";

import { useState } from "react";
import { Server } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  server: Server;
  onClose: () => void;
  onRenamed: () => void;
};

export default function RenameServerModal({ server, onClose, onRenamed }: Props) {
  const [name, setName] = useState(server.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await backendFetch(`/api/servers/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo renombrar el servidor");
        throw new Error(msg);
      }
      onRenamed();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo renombrar el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Cambiar nombre del servidor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-muted">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded bg-surface px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {error && <p className="text-sm text-ruby">{error}</p>}

          <div className="flex justify-end gap-2 text-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded px-4 py-1.5 text-text-secondary hover:text-white disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded bg-gold px-4 py-1.5 font-semibold text-deep hover:bg-gold/90 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
