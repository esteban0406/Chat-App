import { API, request } from "../../services/api";

export const createChannel = (data) => request(API.post("/channels", data));
export const getChannels = (serverId) =>
  request(API.get(`/channels/${serverId}`));
export const deleteChannel = (channelId) =>
  request(API.delete(`/channels/${channelId}`));
export const updateChannel = (channelId, data) =>
  request(API.patch(`/channels/${channelId}`, data));
