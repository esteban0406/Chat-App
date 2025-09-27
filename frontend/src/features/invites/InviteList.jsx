import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvites, respondInvite } from "./invitesSlice";
import "./InviteList.css";

export default function InviteList() {
  const dispatch = useDispatch();
  const { items: invites, loading, error } = useSelector(
    (state) => state.invites
  );

  // Cargar invitaciones al montar el componente
  useEffect(() => {
    dispatch(fetchInvites());
  }, [dispatch]);

  if (loading) return <p>Cargando invitaciones...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  // Filtrar solo las invitaciones de amistad
  const friendInvites = invites.filter((i) => i.type === "friend");

  return (
    <div className="invite-list-container">
      <h3>Solicitudes de amistad</h3>
      {friendInvites.length === 0 ? (
        <p>No tienes invitaciones</p>
      ) : (
        <ul className="invite-list">
          {friendInvites.map((invite) => (
            <li key={invite._id} className="invite-item">
              <div>
                <strong>{invite.from?.username || "Desconocido"}</strong>{" "}
                <span>({invite.from?.email || "Sin email"})</span>
              </div>

              <div className="invite-actions">
                <button
                  className="accept"
                  onClick={() =>
                    dispatch(
                      respondInvite({
                        id: invite._id,
                        status: "accepted",
                        type: invite.type,
                      })
                    )
                  }
                >
                  Aceptar
                </button>
                <button
                  className="reject"
                  onClick={() =>
                    dispatch(
                      respondInvite({
                        id: invite._id,
                        status: "rejected",
                        type: invite.type,
                      })
                    )
                  }
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
