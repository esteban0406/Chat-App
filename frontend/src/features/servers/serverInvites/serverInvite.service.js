import { API, request } from "../../../services/api";

export const getServerInvites = () => request(API.get("/invites/pending"));
export const sendServerInvite = (data) =>
  request(API.post("/invites/send", data));
export const acceptServerInvite = (inviteId) =>
  request(API.post(`/invites/accept/${inviteId}`, { status: "accepted" }));
export const rejectServerInvite = (inviteId) =>
  request(API.post(`/invites/reject/${inviteId}`, { status: "rejected" }));
