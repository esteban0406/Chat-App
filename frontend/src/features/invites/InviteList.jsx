import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriendInvites, respondFriendInvite } from "./friendInvitesSlice";
import "./InviteList.css";

export default function InviteList() {
  const dispatch = useDispatch();
  const {
    items: invites,
    loading,
    error,
  } = useSelector((state) => state.friendInvites);

  useEffect(() => {
    dispatch(fetchFriendInvites());
  }, [dispatch]);

  if (loading) return <p>Cargando invitaciones...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div className="invite-list-container">
      <h3>Solicitudes de amistad</h3>
      {invites.length === 0 ? (
        <p>No tienes invitaciones</p>
      ) : (
        <ul className="invite-list">
          {invites.map((invite) => (
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
                      respondFriendInvite({
                        id: invite._id,
                        status: "accepted",
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
                      respondFriendInvite({
                        id: invite._id,
                        status: "rejected",
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
