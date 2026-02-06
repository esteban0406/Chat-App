"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ServerInvite, Server } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

export default function ServerInviteList() {
  const router = useRouter();
  const [invites, setInvites] = useState<ServerInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadInvites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendFetch("/api/server-invites/pending", {
        cache: "no-store",
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudieron cargar las invitaciones");
        throw new Error(msg);
      }
      const body = await res.json();
      const list = unwrapList<ServerInvite>(body, "invites");
      setInvites(list);
    } catch (err) {
      console.error(err);
      setInvites([]);
      const message = err instanceof Error ? err.message : "No se pudieron cargar las invitaciones";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleAction = async (
    invite: ServerInvite,
    action: "accept" | "reject"
  ) => {
    const inviteId = invite.id;
    setProcessingId(inviteId);
    try {
      const res = await backendFetch(
        `/api/server-invites/${inviteId}/${action}`,
        {
        method: "POST",
        }
      );
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "No se pudo actualizar la invitación");
        throw new Error(msg);
      }
      setInvites((prev) => prev.filter((item) => item.id !== inviteId));
      if (action === "accept") {
        const serverId =
          typeof invite.server === "string"
            ? invite.server
            : invite.server?.id;
        if (serverId) {
          router.push(`/servers/${serverId}`);
        }
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo actualizar la invitación";
      setError(message);
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
              onClick={() => handleAction(invite, "accept")}
              disabled={processingId === invite.id}
              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => handleAction(invite, "reject")}
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
