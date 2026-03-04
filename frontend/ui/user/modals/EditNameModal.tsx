"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { updateUser, User } from "@/lib/auth";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: (updatedUser: User) => void;
};

export default function EditNameModal({ user, onClose, onUpdated }: Props) {
  const { t } = useTranslation(["user", "common"]);
  const [name, setName] = useState(user.username ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user.username ?? "");
  }, [user]);

  const closeModal = () => {
    if (loading) return;
    setName(user.username ?? "");
    setError("");
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError(t('user:editName.emptyError'));
      return;
    }

    if (trimmed === user.username) {
      setError(t('user:editName.sameError'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updated = await updateUser({ username: trimmed });
      if (updated) onUpdated(updated);
      setError("");
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al actualizar nombre");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-96 rounded-lg bg-deep border border-border p-6 text-white shadow-lg">
        <h2 className="mb-4 text-lg font-bold">{t('user:editName.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            disabled={loading}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            placeholder={t('user:editName.placeholder')}
          />

          {error ? <p className="text-sm text-ruby">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded bg-surface px-4 py-2 hover:bg-surface/80 disabled:opacity-60"
            >
              {t('common:cancel')}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-gold px-4 py-2 text-deep hover:bg-gold/90 disabled:opacity-60"
            >
              {loading ? t('user:editName.saving') : t('common:save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
