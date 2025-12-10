"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";

export default function EditAvatarModal({ open, setOpen, user }) {
  const [preview, setPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset modal when closed
  useEffect(() => {
    if (!open) {
      setPreview("");
      setFile(null);
      setError("");
    }
  }, [open]);

  /** Load image file and show preview */
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

  /** Upload avatar to backend */
  async function handleSave() {
    if (!file) {
      setError("Selecciona una imagen antes de guardar");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.id}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authClient.getToken()}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("No se pudo actualizar el avatar");
      }

      // Refresh session so new avatar version loads
      await authClient.refresh();

      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Error al subir imagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => (loading ? null : setOpen(false))} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-gray-800 p-6 text-white">

          <Dialog.Title className="text-lg font-bold mb-3">Edit Avatar</Dialog.Title>

          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={handleFileChange}
            className="w-full mb-3 text-gray-300"
          />

          {preview && (
            <div className="flex justify-center mb-3">
              <img
                src={preview}
                alt="Preview"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-blue-500"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="px-3 py-1 rounded bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading || !file}
              className="px-3 py-1 rounded bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
