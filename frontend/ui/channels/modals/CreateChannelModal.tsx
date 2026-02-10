"use client";

import { useState } from "react";
import { Channel } from "@/lib/definitions";
import { useRouter } from "next/navigation";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type ChannelType = "TEXT" | "VOICE";

type Props = {
  serverId: string;
  defaultType?: ChannelType;
  onClose: () => void;
  onCreated?: (channel: Channel) => void;
};

export default function CreateChannelModal({
  serverId,
  defaultType = "TEXT",
  onClose,
  onCreated,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serverId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await backendFetch(`/api/servers/${serverId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo crear el canal");
        throw new Error(msg);
      }

      const response = await res.json();
      onCreated?.(response.id);
      onClose();
      router.push(`/servers/${serverId}/channels/${response.id}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo crear el canal";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Crear canal</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">
              Nombre del canal
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="general"
              className="w-full rounded bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">
              Tipo
            </label>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as ChannelType)
              }
              className="w-full rounded bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="TEXT">Texto</option>
              <option value="VOICE">Voz</option>
            </select>
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
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
