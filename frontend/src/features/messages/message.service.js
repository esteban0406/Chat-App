import { API, request } from "../../services/api";

export const sendMessage = (data) => request(API.post("/messages", data));
export const getMessages = (channelId) =>
  request(API.get(`/messages/${channelId}`));
