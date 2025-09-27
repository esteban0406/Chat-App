import React from "react";
import "./invites.css";
import "./InviteItem.css";

export default function InviteItem({ invite, onRespond }) {
  const isFriendInvite = invite.type === "friend";
  const label = isFriendInvite
    ? `Solicitud de amistad de ${invite.from.username}`
    : `Invitación al servidor ${invite.server?.name || ""}`;

  return (
    <div className="invite-item">
      <p>{label}</p>
      <div className="invite-actions">
        <button onClick={() => onRespond(invite._id, "accepted")}>Aceptar</button>
        <button onClick={() => onRespond(invite._id, "rejected")}>Rechazar</button>
      </div>
    </div>
  );
}
