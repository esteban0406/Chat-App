"use client";

import { useEffect, useState } from "react";
import { FriendRequest, User } from "@/lib/definitions";
import { backendFetch } from "@/lib/backend-client";

export default function FriendRequestsList() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendFetch("/api/friends/pending", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("No se pudieron cargar las solicitudes");
      }
      const body = await res.json();
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.data?.requests)
        ? body.data.requests
        : Array.isArray(body?.requests)
        ? body.requests
        : [];
      setRequests(list);
    } catch (err) {
      console.error(err);
      setRequests([]);
      setError("No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResponse = async (id: string, status: "accepted" | "rejected") => {
    setRespondingId(id);
    try {
      const res = await backendFetch(`/api/friends/respond/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error("No se pudo responder la solicitud");
      }
      setRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la solicitud");
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Cargando solicitudes...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!requests.length) {
    return <p className="text-gray-400">No tienes solicitudes pendientes.</p>;
  }

  return (
    <ul className="space-y-2">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex items-center justify-between rounded bg-gray-800 px-4 py-2 text-sm text-white"
        >
          <span>
            <strong>{(request.from as User)?.username ?? "Usuario"}</strong>{" "}
            <span className="text-gray-400">
              ({(request.from as User)?.email ?? "Sin email"})
            </span>
          </span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => handleResponse(request.id, "accepted")}
              disabled={respondingId === request.id}
              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleResponse(request.id, "rejected")}
              disabled={respondingId === request.id}
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
