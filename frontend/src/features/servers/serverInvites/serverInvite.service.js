import { API, request } from "../../../services/api";

export const getServerInvites = () => request(API.get("/ServerInvites/pending"));
export const sendServerInvite = (data) =>
  request(API.post("/ServerInvites/send", data));
export const acceptServerInvite = (inviteId) =>
  request(API.post(`/ServerInvites/accept/${inviteId}`, { status: "accepted" }));
export const rejectServerInvite = (inviteId) =>
  request(API.post(`/ServerInvites/reject/${inviteId}`, { status: "rejected" }));
