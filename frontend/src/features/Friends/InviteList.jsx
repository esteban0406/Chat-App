import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriendInvites, respondFriendInvite } from "./friendInvitesSlice";

export default function InviteList() {
  const dispatch = useDispatch();
  const { items: invites, loading, error } = useSelector((state) => state.friendInvites);

  useEffect(() => {
    dispatch(fetchFriendInvites());
  }, [dispatch]);

  if (loading) return <p className="text-gray-400">Cargando invitaciones...</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  return (
    <div>
      {invites.length === 0 ? (
        <p className="text-gray-400">No tienes invitaciones</p>
      ) : (
        <ul className="space-y-2">
          {invites.map((invite) => (
            <li
              key={invite._id}
              className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-md"
            >
              <span>
                <strong>{invite.from?.username || "Desconocido"}</strong>{" "}
                <span className="text-gray-400">({invite.from?.email || "Sin email"})</span>
              </span>
              <div className="space-x-2">
                <button
                  onClick={() =>
                    dispatch(respondFriendInvite({ id: invite._id, status: "accepted" }))
                  }
                  className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                >
                  Aceptar
                </button>
                <button
                  onClick={() =>
                    dispatch(respondFriendInvite({ id: invite._id, status: "rejected" }))
                  }
                  className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
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
