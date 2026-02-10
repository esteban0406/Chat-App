"use client";

import { useEffect, useState } from "react";
import { updateUser, User } from "@/lib/auth";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
};

export default function EditNameModal({ user, onClose, onUpdated }: Props) {
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
      setError("El nombre no puede estar vacío");
      return;
    }

    if (trimmed === user.username) {
      setError("Debes ingresar un nombre diferente");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateUser({ username: trimmed });
      onUpdated();
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
        <h2 className="mb-4 text-lg font-bold">Editar nombre</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            disabled={loading}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded bg-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            placeholder="Nuevo nombre de usuario"
          />

          {error && <p className="text-sm text-ruby">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded bg-surface px-4 py-2 hover:bg-surface/80 disabled:opacity-60"
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
