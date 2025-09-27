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
