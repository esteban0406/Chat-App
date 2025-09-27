import React, { useEffect, useState } from "react";
import {
  getServerInvites,
  rejectServerInvite,
  acceptServerInvite
} from "../invites/invite.service";
import "./InviteFriendsModal.css";


export default function ServerInviteList() {
  const [invites, setInvites] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await getServerInvites();
        setInvites(res.data);
      } catch (err) {
        console.error("Error cargando invitaciones de servidor:", err);
      }
    };
    fetchInvites();
  }, []);

  const handleRespond = async (inviteId, action) => {
    try {
      if (action === "accepted") {
        await acceptServerInvite(inviteId);
        setStatus("Invitación aceptada ✅");
      } else {
        await rejectServerInvite(inviteId);
        setStatus("Invitación rechazada ❌");
      }

      // 🔹 Quitar la invitación de la lista después de responder
      setInvites(invites.filter((i) => i._id !== inviteId));
    } catch (err) {
      console.error("Error respondiendo invitación:", err);
      setStatus("Error al responder la invitación ❌");
    }
  };

  return (
    <div className="invite-list">
      <h3>Invitaciones a Servidores</h3>

      {invites.length === 0 ? (
        <p>No tienes invitaciones pendientes</p>
      ) : (
        <ul>
          {invites.map((invite) => (
            <li key={invite._id}>
              Invitación al servidor{" "}
              {invite.server?.name || "Servidor eliminado"}
              <div>
                <button onClick={() => handleRespond(invite._id, "accepted")}>
                  Aceptar
                </button>
                <button onClick={() => handleRespond(invite._id, "rejected")}>
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {status && <p>{status}</p>}
    </div>
  );
}
