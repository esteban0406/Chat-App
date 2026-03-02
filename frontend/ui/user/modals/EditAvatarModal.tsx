"use client";

import { useState, useEffect, useRef } from "react";
import { backendFetch, extractErrorMessage } from "@/lib/backend-client";
import Image from "next/image";

type Props = {
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditAvatarModal({ onClose, onUpdated }: Props) {
  const [preview, setPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const resetState = () => {
    setPreview("");
    setFile(null);
    setError("");
    setIsDragging(false);
  };

  const closeModal = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  function processFile(selected: File) {
    if (!selected.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5MB");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreview(objectUrl);
    setError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
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
        const msg = await extractErrorMessage(
          res,
          "No se pudo actualizar el avatar",
        );
        throw new Error(msg);
      }

      onUpdated?.();
      closeModal();
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
          {/* Hidden real file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drop zone (no file selected) */}
          {!preview && (
            <div
              onClick={() => !loading && inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200",
                loading ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                isDragging
                  ? "border-gold bg-gold/10"
                  : "border-border bg-surface/40 hover:border-gold/60 hover:bg-surface/70",
              ].join(" ")}
            >
              {/* Camera icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={[
                  "h-10 w-10 transition-colors duration-200",
                  isDragging ? "text-gold" : "text-text-muted",
                ].join(" ")}
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>

              <div className="text-center">
                <p
                  className={[
                    "text-sm font-medium transition-colors duration-200",
                    isDragging ? "text-gold" : "text-text-secondary",
                  ].join(" ")}
                >
                  {isDragging
                    ? "Suelta para subir"
                    : "Arrastra una imagen o haz clic aquí"}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  PNG · JPG · GIF &nbsp;•&nbsp; máx. 5 MB
                </p>
              </div>
            </div>
          )}

          {/* Preview with change overlay */}
          {preview && (
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => !loading && inputRef.current?.click()}
                className={[
                  "group relative h-24 w-24 rounded-full",
                  loading ? "cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
              >
                <Image
                  src={preview}
                  alt="Vista previa del avatar"
                  fill
                  unoptimized
                  className="rounded-full object-cover ring-2 ring-gold"
                />
                {/* Hover overlay */}
                {!loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-white"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-[10px] font-semibold text-white">
                      Cambiar
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-text-muted">
                Haz clic en la imagen para cambiarla
              </p>
            </div>
          )}

          {error ? <p className="text-sm text-ruby">{error}</p> : null}

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
