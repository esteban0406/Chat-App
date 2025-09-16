import React, { useEffect, useState } from "react";
import {
  getFriendInvites,
  acceptFriendInvite,
  rejectFriendInvite,
} from "../../services/api";
import InviteItem from "./InviteItem.jsx";

export default function InviteList() {
  const [invites, setInvites] = useState([]);

  const fetchInvites = async () => {
    try {
      const res = await getFriendInvites();
      setInvites(res.data);
    } catch (err) {
      console.error("Error cargando invitaciones:", err);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleRespond = async (inviteId, status) => {
    try {
      if (status === "accepted") {
        await acceptFriendInvite(inviteId);
      } else {
        await rejectFriendInvite(inviteId);
      }
      // Recargar lista después de responder
      fetchInvites();
    } catch (err) {
      console.error("Error respondiendo invitación:", err);
    }
  };

  return (
    <div>
      <h3>Solicitudes pendientes</h3>
      {invites.length === 0 ? (
        <p>No tienes invitaciones</p>
      ) : (
        invites.map((invite) => (
          <InviteItem
            key={invite._id}
            invite={invite}
            onRespond={handleRespond}
          />
        ))
      )}
    </div>
  );
}
