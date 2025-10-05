import React, { useEffect, useState } from "react";
import {getFriends} from "../../invites/friend.service"
import {sendServerInvite} from "../serverInvites/serverInvite.service.js"
import { useServers } from "../useServers";
import "./InviteFriendsModal.css";

export default function InviteFriendsModal({ onClose }) {
  const [friends, setFriends] = useState([]);
  const [status, setStatus] = useState("");
  const { activeServer: server } = useServers();

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

  const handleInvite = async (friendId) => {
    try {
      if (!server) return; 
      await sendServerInvite({ serverId: server._id, to: friendId });
      setStatus("Invitación enviada ✅");
    } catch (err) {
      setStatus("Error enviando invitación ❌");
      console.error(err);
    }
  };

  if (!server) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <p>Cargando servidor...</p>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Invitar amigos a {server.name}</h3>
        <button className="close-btn" onClick={onClose}>X</button>

        {(!friends || friends.length === 0) ? (
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
