"use client";

import { useState } from "react";
import { Channel } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  channel: Channel;
  onClose: () => void;
  onUpdated?: (channel: Channel) => void;
};

export default function EditChannelModal({
  channel,
  onClose,
  onUpdated,
}: Props) {
  const [name, setName] = useState(channel?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!channel?.id) return;

    setLoading(true);
    setError(null);

    const channelId = channel.id;

    try {
      const res = await backendFetch(`/api/servers/${channel.serverId}/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo actualizar el canal");
        throw new Error(msg);
      }

      const body = await res.json();
      onUpdated?.(body);
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo actualizar el canal";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">
          Editar canal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {error && (
            <p className="text-sm text-ruby">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-surface px-4 py-2 hover:bg-surface/80"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-gold px-4 py-2 text-deep hover:bg-gold/90 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
