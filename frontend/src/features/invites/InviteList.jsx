import React, { useEffect, useState } from "react";
import { getFriendInvites } from "../../services/api";

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

  return (
    <div>
      <h3>Solicitudes pendientes</h3>
      {invites.length === 0 ? (
        <p>No tienes invitaciones</p>
      ) : (
        invites.map((invite) => (
          <div key={invite._id}>
            <p>{invite.from.username}</p>
          </div>
        ))
      )}
    </div>
  );
}
