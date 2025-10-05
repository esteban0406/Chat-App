import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServerInvites, respondServerInvite } from "./serverInvitesSlice.js";

export default function ServerInviteList() {
  const dispatch = useDispatch();
  const { items: invites, loading, error } = useSelector((state) => state.invites);

  useEffect(() => {
    dispatch(fetchServerInvites());
  }, [dispatch]);

  if (loading) return <p>Cargando invitaciones...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="invite-list">
      <h3>Invitaciones a servidores</h3>
      {invites.length === 0 ? (
        <p>No tienes invitaciones pendientes</p>
      ) : (
        <ul>
          {invites.map((invite) => (
            <li key={invite._id}>
              Invitación al servidor {invite.server?.name || "Servidor eliminado"}
              <div>
                <button onClick={() => dispatch(respondServerInvite({ id: invite._id, status: "accepted", type: invite.type }))}>Aceptar</button>
                <button onClick={() => dispatch(respondServerInvite({ id: invite._id, status: "rejected", type: invite.type }))}>Rechazar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
