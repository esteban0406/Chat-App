import { API, request } from "../../services/api";

export const getFriendInvites = () => request(API.get("/friends/pending"));
export const sendFriendInvite = (data) =>
  request(API.post("/friends/send", data));
export const acceptFriendInvite = (inviteId) =>
  request(API.post(`/friends/respond/${inviteId}`, { status: "accepted" }));
export const rejectFriendInvite = (inviteId) =>
  request(API.post(`/friends/respond/${inviteId}`, { status: "rejected" }));

export const getFriends = () => request(API.get("/friends/list"));
