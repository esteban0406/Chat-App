"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { ServerInvite, Server } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";
import { useNotificationSocket } from "@/lib/useNotificationSocket";

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

  useNotificationSocket({
    onServerInviteReceived: (invite) => {
      setInvites((prev) =>
        prev.some((i) => i.id === invite.id) ? prev : [invite, ...prev]
      );
    },
    onServerInviteCancelled: ({ inviteId }) => {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    },
  });

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
    return <p className="text-text-muted">Cargando invitaciones...</p>;
  }

  if (error) {
    return <p className="text-ruby">{error}</p>;
  }

  if (!invites.length) {
    return <p className="text-text-muted">No tienes invitaciones pendientes.</p>;
  }

  return (
    <ul className="space-y-2">
      {invites.map((invite) => (
        <li
          key={invite.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface/30 px-4 py-3 text-sm"
        >
          <span className="text-text-primary">
            Invitación al servidor{" "}
            <strong className="text-gold">{(invite.server as Server)?.name ?? "Servidor"}</strong>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAction(invite, "accept")}
              disabled={processingId === invite.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-muted text-gold transition hover:bg-gold hover:text-deep disabled:opacity-60"
              aria-label="Aceptar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAction(invite, "reject")}
              disabled={processingId === invite.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ruby-muted text-ruby transition hover:bg-ruby hover:text-white disabled:opacity-60"
              aria-label="Rechazar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
