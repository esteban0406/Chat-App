"use client";

import { useState } from "react";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditAvatarModal({ onClose, onUpdated }: Props) {
  const [preview, setPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setPreview("");
    setFile(null);
    setError("");
  };

  const closeModal = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2MB");
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !preview) {
      setError("Selecciona una imagen antes de guardar");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await backendFetch("/api/users/me/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: preview }),
      });

      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo actualizar el avatar");
        throw new Error(msg);
      }

      onUpdated?.();
      resetState();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-96 rounded-lg bg-gray-800 p-6 text-white shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Editar avatar</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={handleFileChange}
            className="w-full text-sm text-gray-300"
          />

          {preview && (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Vista previa del avatar"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-indigo-500"
              />
            </div>
          )}

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
              disabled={loading || !file}
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
