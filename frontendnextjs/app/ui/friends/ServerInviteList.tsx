"use client";

import { useEffect, useState } from "react";
import { ServerInvite, Server } from "@/app/lib/definitions";

export default function ServerInviteList() {
  const [invites, setInvites] = useState<ServerInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadInvites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/server-invites/pending", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("No se pudieron cargar las invitaciones");
      }
      const body = await res.json();
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.data?.invites)
        ? body.data.invites
        : Array.isArray(body?.invites)
        ? body.invites
        : [];
      setInvites(list);
    } catch (err) {
      console.error(err);
      setInvites([]);
      setError("No se pudieron cargar las invitaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleAction = async (
    inviteId: string,
    action: "accept" | "reject"
  ) => {
    setProcessingId(inviteId);
    try {
      const res = await fetch(`/api/server-invites/${action}/${inviteId}`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("No se pudo actualizar la invitación");
      }
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la invitación");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Cargando invitaciones...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!invites.length) {
    return <p className="text-gray-400">No tienes invitaciones pendientes.</p>;
  }

  return (
    <ul className="space-y-2">
      {invites.map((invite) => (
        <li
          key={invite.id}
          className="flex items-center justify-between rounded bg-gray-800 px-4 py-2 text-sm text-white"
        >
          <span>
            Invitación al servidor{" "}
            <strong>{(invite.server as Server)?.name ?? "Servidor"}</strong>
          </span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => handleAction(invite.id, "accept")}
              disabled={processingId === invite.id}
              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleAction(invite.id, "reject")}
              disabled={processingId === invite.id}
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
