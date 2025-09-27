import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvites, respondInvite } from "./invitesSlice";

export default function InviteList() {
  const dispatch = useDispatch();
  const { items: invites, loading, error } = useSelector((state) => state.invites);

  useEffect(() => {
    dispatch(fetchInvites());
  }, [dispatch]);

  if (loading) return <p>Cargando invitaciones...</p>;
  if (error) return <p>Error: {error}</p>;

  const friendInvites = invites.filter((i) => i.type === "friend");

  return (
    <div className="friend-list">
      <h3>Solicitudes de amistad</h3>
      {friendInvites.length === 0 ? (
        <p>No tienes invitaciones</p>
      ) : (
        <ul>
          {friendInvites.map((invite) => (
            <li key={invite._id}>
              {invite.from?.username || "Desconocido"}{" "}
              <span style={{ color: "gray" }}>({invite.from?.email || "Sin email"})</span>
              <div style={{ marginTop: "8px" }}>
                <button onClick={() => dispatch(respondInvite({ id: invite._id, status: "accepted", type: invite.type }))}>Aceptar</button>
                <button onClick={() => dispatch(respondInvite({ id: invite._id, status: "rejected", type: invite.type }))}>Rechazar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
