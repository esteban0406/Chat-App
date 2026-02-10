"use client";

import { useState } from "react";
import { Channel } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  channel: Channel;
  onClose: () => void;
  onDeleted?: (channelId: string) => void;
};

export default function DeleteChannelModal({
  channel,
  onClose,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelId = channel?.id ?? "";

  const handleDelete = async () => {
    if (!channelId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await backendFetch(`/api/servers/${channel.serverId}/channels/${channelId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo eliminar el canal");
        throw new Error(msg);
      }

      onDeleted?.(channelId);
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo eliminar el canal";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-ruby">
          Eliminar canal
        </h2>
        <p className="text-sm text-text-muted">
          ¿Seguro que quieres eliminar el canal{" "}
          <span className="font-semibold text-white">
            #{channel?.name}
          </span>
          ? Esta acción no se puede deshacer.
        </p>

        {error && (
          <p className="mt-3 text-sm text-ruby">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-surface px-4 py-2 hover:bg-surface/80"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded bg-ruby px-4 py-2 hover:bg-ruby/90 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
