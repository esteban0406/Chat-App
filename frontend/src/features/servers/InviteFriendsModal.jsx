// src/features/servers/InviteFriendsModal.jsx
import React, { useEffect, useState } from "react";
import {getFriends, sendServerInvite} from "../invites/invite.service"
import "./InviteFriendsModal.css";

export default function InviteFriendsModal({ server, onClose }) {
  const [friends, setFriends] = useState([]);
  const [status, setStatus] = useState("");

  if (!server) return null

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriends();
        setFriends(res.data);
      } catch (err) {
        console.error("Error cargando amigos:", err);
      }
    };
    fetchFriends();
  }, []);

  const handleInvite = async (friendId) => {
    try {
      await sendServerInvite({ serverId: server._id, to: friendId });
      setStatus("Invitación enviada ✅");
    } catch (err) {
      setStatus("Error enviando invitación ❌");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        {console.log(server)}
        <h3>Invitar amigos a {server.name}</h3>
        <button className="close-btn" onClick={onClose}>X</button>

        {friends.length === 0 ? (
          <p>No tienes amigos disponibles</p>
        ) : (
          <ul className="friend-list">
            {friends.map((f) => (
              <li key={f._id}>
                <span>{f.username}</span>
                <button onClick={() => handleInvite(f._id)}>Invitar</button>
              </li>
            ))}
          </ul>
        )}

        {status && <p>{status}</p>}
      </div>
    </div>
  );
}
