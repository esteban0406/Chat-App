"use client";

import { useEffect, useState } from "react";
import { Friendship, User } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

export default function FriendRequestsList() {
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendFetch("/api/friendships/pending", {
        cache: "no-store",
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudieron cargar las solicitudes");
        throw new Error(msg);
      }
      const body = await res.json();
      const list = unwrapList<Friendship>(body, "requests");
      setRequests(list);
    } catch (err) {
      console.error(err);
      setRequests([]);
      const message = err instanceof Error ? err.message : "No se pudieron cargar las solicitudes";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResponse = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    setRespondingId(id);
    try {
      const res = await backendFetch(`/api/friendships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo responder la solicitud");
        throw new Error(msg);
      }
      setRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo actualizar la solicitud";
      setError(message);
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
            <strong>{(request.sender as User)?.username ?? "Usuario"}</strong>{" "}
            <span className="text-gray-400">
              ({(request.sender as User)?.email ?? "Sin email"})
            </span>
          </span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => handleResponse(request.id, "ACCEPTED")}
              disabled={respondingId === request.id}
              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleResponse(request.id, "REJECTED")}
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
