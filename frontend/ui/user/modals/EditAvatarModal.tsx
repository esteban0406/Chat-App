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

    if (selected.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5MB");
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
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await backendFetch("/api/users/me", {
        method: "PATCH",
        body: formData,
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
      <div className="w-96 rounded-lg bg-deep border border-border p-6 text-white shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Editar avatar</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={handleFileChange}
            className="w-full text-sm text-text-muted"
          />

          {preview && (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Vista previa del avatar"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-gold"
              />
            </div>
          )}

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
              disabled={loading || !file}
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
