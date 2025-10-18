import React, { useEffect, useMemo, useState } from "react";
import { getFriends } from "../../invites/friend.service";
import { sendServerInvite } from "../serverInvites/serverInvite.service.js";
import { useServers } from "../useServers";
import { API } from "../../../services/api"; // 👈 tu wrapper axios

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
        setFriends(Array.isArray(res) ? res : []);
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
        const res = await API.get(`/invites/pending?serverId=${server._id}`);
        setPendingInvites(Array.isArray(res.data) ? res.data : []);
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
    return new Set(server.members.map((m) => String(m._id)));
  }, [server]);

  // IDs ya pendientes
  const pendingIds = useMemo(() => {
    return new Set(pendingInvites.map((inv) => String(inv.to)));
  }, [pendingInvites]);

  // filtrar amigos
  const eligibleFriends = useMemo(() => {
    return friends.filter(
      (f) =>
        !memberIds.has(String(f._id)) &&
        !pendingIds.has(String(f._id)) &&
        !invitedIds.has(String(f._id))
    );
  }, [friends, memberIds, pendingIds, invitedIds]);

  const handleInvite = async (friendId) => {
    try {
      if (!server) return;
      await sendServerInvite({ serverId: server._id, to: friendId });
      setInvitedIds((prev) => new Set(prev).add(String(friendId)));
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
                key={f._id}
                className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded"
              >
                <span>{f.username}</span>
                <button
                  onClick={() => handleInvite(f._id)}
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
