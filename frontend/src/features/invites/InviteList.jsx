
import React, { useEffect, useState } from "react";
import {
  getFriendInvites,
  acceptFriendInvite,
  rejectFriendInvite,
} from "./invite.service";
import "./invites.css";

export default function InviteList() {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await getFriendInvites();
        setInvites(res.data);
      } catch (err) {
        console.error("Error cargando invitaciones:", err);
      }
    };
    fetchInvites();
  }, []);

  const handleRespond = async (inviteId, status) => {
    try {
      if (status === "accepted") {
        await acceptFriendInvite(inviteId);
      } else {
        await rejectFriendInvite(inviteId);
      }
      const res = await getFriendInvites();
      setInvites(res.data);
    } catch (err) {
      console.error("Error respondiendo invitación:", err);
    }
  };

  return (
    <div className="friend-list">
      <h3>Solicitudes pendientes</h3>
      {invites.length === 0 ? (
        <p>No tienes invitaciones</p>
      ) : (
        <ul>
          {invites.map((invite) => (
            <li key={invite._id}>
              {invite.from?.username || "Desconocido"}{" "}
              <span style={{ color: "gray" }}>
                ({invite.from?.email || "Sin email"})
              </span>
              <div className="invite-actions" style={{ marginTop: "8px" }}>
                <button onClick={() => handleRespond(invite._id, "accepted")}>Aceptar</button>
                <button onClick={() => handleRespond(invite._id, "rejected")}>Rechazar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}