"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { backendFetch } from "@/lib/backend-client";

type Props = {
  onClose: () => void;
  created: () => void;
};

export default function CreateServerModal({ onClose, created }: Props) {
  const router = useRouter();

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
        throw new Error("No se pudo crear el servidor");
      }
      const response = await res.json();
      created();
      router.push(`/servers/${response.data.server.id}`);     
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el servidor ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-96 rounded-lg bg-gray-800 p-6 text-white shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Crear Servidor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del servidor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-600 px-4 py-2 hover:bg-gray-500"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-indigo-600 px-4 py-2 hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
