"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Server } from "@/lib/definitions";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

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
  const { t } = useTranslation(["servers", "common"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!server) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendFetch(`/api/servers/${server.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo eliminar el servidor");
        throw new Error(msg);
      }
      onDeleted?.();
      onClose();
      router.push("/home");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo eliminar el servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <h3 className="text-lg font-semibold mb-3">
          {t('servers:delete.title')}
        </h3>
        <p className="text-sm text-text-muted">
          {t('servers:delete.confirmation', { name: server.name })}
        </p>

        {error && (
          <p className="mt-3 text-sm text-ruby">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded bg-surface px-4 py-2 font-semibold hover:bg-surface/80 disabled:opacity-60"
          >
            {t('common:cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded bg-ruby px-4 py-2 font-semibold hover:bg-ruby/90 disabled:opacity-60"
          >
            {loading ? t('servers:delete.deleting') : t('common:delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
