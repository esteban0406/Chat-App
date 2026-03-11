"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  onClose: () => void;
  created: () => void;
};

export default function CreateServerModal({ onClose, created }: Props) {
  const router = useRouter();
  const { t } = useTranslation(["servers", "common"]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await backendFetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo crear el servidor");
        throw new Error(msg);
      }
      const response = await res.json();
      created();
      router.push(`/servers/${response.id}`);
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo crear el servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-deep border border-border p-6 text-white shadow-lg">
        <h2 className="mb-4 text-lg font-bold">{t('servers:create.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t('servers:create.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded bg-surface px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gold"
          />

          <textarea
            placeholder={t('servers:create.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />

          {error ? <p className="text-sm text-ruby">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-surface px-4 py-2 min-h-[44px] hover:bg-surface/80"
              disabled={loading}
            >
              {t('common:cancel')}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-gold px-4 py-2 min-h-[44px] text-deep hover:bg-gold/90 disabled:opacity-60"
            >
              {loading ? t('servers:create.creating') : t('common:create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
