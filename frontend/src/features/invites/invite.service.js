// invite.service.js
import { API, request } from "../../services/api";

// 🔹 Server Invites
export const getServerInvites = () => request(API.get("/invites/pending"));
export const sendServerInvite = (data) =>
  request(API.post("/invites/send", data));
export const acceptServerInvite = (inviteId) =>
  request(API.post(`/invites/accept/${inviteId}`));
export const rejectServerInvite = (inviteId) =>
  request(API.post(`/invites/reject/${inviteId}`));

// 🔹 Friend Invites
export const getFriendInvites = () => request(API.get("/friends/pending"));
export const sendFriendInvite = (data) =>
  request(API.post("/friends/send", data));
export const acceptFriendInvite = (inviteId) =>
  request(API.post(`/friends/respond/${inviteId}`, { status: "accepted" }));
export const rejectFriendInvite = (inviteId) =>
  request(API.post(`/friends/respond/${inviteId}`, { status: "rejected" }));
export const getFriends = () => request(API.get("/friends/list"));

// 🔹 Genérico
export const respondToInvite = (id, status, type) => {
  if (type === "friend") {
    return status === "accepted"
      ? acceptFriendInvite(id)
      : rejectFriendInvite(id);
  }

  if (type === "server") {
    return status === "accepted"
      ? acceptServerInvite(id)
      : rejectServerInvite(id);
  }

  throw new Error("Tipo de invitación desconocido");
};

export const getInvites = async () => {
  // Llamar ambas en paralelo
  const [serverInvites, friendInvites] = await Promise.all([
    getServerInvites(),
    getFriendInvites(),
  ]);

  // Normalizar y devolver en un solo array
  return [
    ...serverInvites.map((i) => ({ ...i, type: "server" })),
    ...friendInvites.map((i) => ({ ...i, type: "friend" })),
  ];
};
