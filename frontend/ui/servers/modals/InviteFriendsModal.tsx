"use client";

import { useEffect, useMemo, useState } from "react";
import { Server, User, ServerInvite } from "@/lib/definitions";
import { backendFetch, unwrapList, extractErrorMessage } from "@/lib/backend-client";

type Props = {
  server: Server;
  onClose: () => void;
};

export default function InviteFriendsModal({ server, onClose }: Props) {
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ServerInvite[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadFriends() {
      try {
        const res = await backendFetch("/api/friendships", {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = await extractErrorMessage(res, "Failed to load friends");
          throw new Error(msg);
        }
        const body = await res.json();
        const list = unwrapList<User>(body, "friends");
        setFriends(list);
      } catch (err) {
        console.error(err);
        setFriends([]);
      }
    }
    loadFriends();
  }, []);

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await backendFetch("/api/server-invites/sent", {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = await extractErrorMessage(res, "Failed to load pending invites");
          throw new Error(msg);
        }
        const data = await res.json();
        const invites = unwrapList<ServerInvite>(data, "invites");
        // Filter to only invites for this server
        const serverInvites = invites.filter(
          (invite) => invite.serverId === server.id
        );
        setPendingInvites(serverInvites);
      } catch (err) {
        console.error(err);
      }
    }

    loadPending();
  }, [server?.id]);

  const memberIds = useMemo(() => {
    if (!server?.members) return new Set<string>();
    return new Set(
      server.members.map((member) => member.userId).filter(Boolean)
    );
  }, [server]);

  const pendingIds = useMemo(
    () =>
      new Set(
        pendingInvites
          .map((invite) => invite.receiverId)
          .filter(Boolean)
      ),
    [pendingInvites]
  );

  const eligibleFriends = friends.filter(
    (friend) => !memberIds.has(friend.id) && !pendingIds.has(friend.id)
  );

  const handleInvite = async (friendId: string) => {
    if (!server?.id || !friendId) return;
    setInvitingId(friendId);
    setStatus(null);
    try {
      const res = await backendFetch(`/api/server-invites/server/${server.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: friendId }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "Failed to send invite");
        throw new Error(msg);
      }
      const invite = await res.json();
      if (invite) {
        setPendingInvites((prev) => [...prev, invite]);
      }
      setStatus("Invitación enviada");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "No se pudo enviar la invitación";
      setStatus(message);
    } finally {
      setInvitingId(null);
    }
  };

  if (!server) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg bg-deep border border-border p-6 text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Invitar amigos a {server.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-white"
          >
            ✕
          </button>
        </div>

        {eligibleFriends.length === 0 ? (
          <p className="text-sm text-text-muted">
            No hay amigos disponibles para invitar.
          </p>
        ) : (
          <ul className="space-y-2">
            {eligibleFriends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center justify-between rounded bg-surface px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {friend.username}{" "}
                  <span className="text-text-muted">({friend.email})</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleInvite(friend.id)}
                  disabled={invitingId === friend.id}
                  className="rounded bg-gold px-3 py-1 text-deep font-semibold text-white hover:bg-gold/90 disabled:opacity-60"
                >
                  {invitingId === friend.id ? "Enviando..." : "Invitar"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {status ? <p className="mt-3 text-sm text-text-muted">{status}</p> : null}
      </div>
    </div>
  );
}
