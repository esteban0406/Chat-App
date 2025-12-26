"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { UpdateUserResult, User } from "@/lib/definitions";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
};

export default function EditNameModal({ user, onClose, onUpdated }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user.name ?? "");
  }, [user]);

  const closeModal = () => {
    if (loading) return;
    setName(user.name ?? "");
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

    if (trimmed === user.name) {
      setError("Debes ingresar un nombre diferente");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = (await authClient.updateUser({
        name: trimmed,
      })) as UpdateUserResult;

      if (!result || result.error) {
        throw new Error(
          result?.error?.message || "No se pudo actualizar el nombre"
        );
      }

      onUpdated();
      setError("");
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError("Error al actualizar nombre");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-96 rounded-lg bg-gray-800 p-6 text-white shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Editar nombre</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            disabled={loading}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nuevo nombre de usuario"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded bg-gray-600 px-4 py-2 hover:bg-gray-500 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-indigo-600 px-4 py-2 hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
