import React, { useEffect, useMemo, useState } from "react";
import { getFriends } from "../../Friends/friend.service.js";
import { sendServerInvite } from "../serverInvites/serverInvite.service.js";
import { useServers } from "../useServers";
import { API, request } from "../../../services/api";

export default function InviteFriendsModal({ onClose }) {
  const [friends, setFriends] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [status, setStatus] = useState("");
  const [invitedIds, setInvitedIds] = useState(new Set());
  const { activeServer: server } = useServers();

  // cargar amigos
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriends();
        if (Array.isArray(res?.friends)) {
          setFriends(res.friends);
        } else if (Array.isArray(res)) {
          setFriends(res);
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.error("Error cargando amigos:", err);
        setFriends([]);
      }
    };
    fetchFriends();
  }, []);

  // cargar invitaciones pendientes del server
  useEffect(() => {
    const fetchPending = async () => {
      try {
        if (!server?._id) return;
        const res = await request(
          API.get("/ServerInvites/pending", {
            params: { serverId: server._id },
          })
        );
        if (Array.isArray(res?.invites)) {
          setPendingInvites(res.invites);
        } else if (Array.isArray(res)) {
          setPendingInvites(res);
        } else {
          setPendingInvites([]);
        }
      } catch (err) {
        console.error("Error cargando pendientes:", err);
        setPendingInvites([]);
      }
    };
    fetchPending();
  }, [server]);

  // miembros actuales
  const memberIds = useMemo(() => {
    if (!server?.members) return new Set();
    return new Set(
      server.members
        .map((member) => member && (member.id || member._id || member))
        .filter(Boolean)
        .map((id) => String(id))
    );
  }, [server]);

  // IDs ya pendientes
  const pendingIds = useMemo(() => {
    return new Set(
      pendingInvites
        .map((inv) => inv && (inv.to?.id || inv.to || inv._id))
        .filter(Boolean)
        .map((id) => String(id))
    );
  }, [pendingInvites]);

  // filtrar amigos
  const eligibleFriends = useMemo(() => {
    return friends.filter(
      (f) =>
        !memberIds.has(String(f.id || f._id)) &&
        !pendingIds.has(String(f.id || f._id)) &&
        !invitedIds.has(String(f.id || f._id))
    );
  }, [friends, memberIds, pendingIds, invitedIds]);

  const handleInvite = async (friendId) => {
    try {
      if (!server) return;
      const id = String(friendId);
      await sendServerInvite({ serverId: server._id, to: id });
      setInvitedIds((prev) => new Set(prev).add(id));
      setStatus("Invitación enviada ✅");
    } catch (err) {
      setStatus("Error enviando invitación ❌");
      console.error(err);
    }
  };

  if (!server) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Invitar amigos a {server.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✖
          </button>
        </div>

        {eligibleFriends.length === 0 ? (
          <p className="text-sm text-gray-300">
            No hay amigos disponibles (ya son miembros, tienen pendiente o ya los invitaste).
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {eligibleFriends.map((f) => (
              <li
                key={f.id || f._id}
                className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded"
              >
                <span>{f.username}</span>
                <button
                  onClick={() => handleInvite(f.id || f._id)}
                  className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-sm"
                >
                  Invitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {status && <p className="text-sm text-gray-300">{status}</p>}
      </div>
    </div>
  );
}
