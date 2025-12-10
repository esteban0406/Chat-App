"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";

export default function EditNameModal({ open, setOpen, user }) {
  const [name, setName] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when opening modal
  useEffect(() => {
    if (open) {
      setName(user?.username || "");
      setError("");
    }
  }, [open, user?.username]);

  async function handleSave() {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user.id}/name`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authClient.getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: trimmed }),
        }
      );

      if (!res.ok) {
        throw new Error("No se pudo actualizar el nombre");
      }

      await authClient.refresh();

      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Error al actualizar nombre");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => (loading ? null : setOpen(false))} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-gray-800 p-6 text-white">
          <Dialog.Title className="text-lg font-bold mb-3">Edit Profile Name</Dialog.Title>

          <input
            value={name}
            disabled={loading}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded bg-gray-700 p-2 mb-2"
            placeholder="New username"
          />

          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}

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
              disabled={loading}
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
