import { API, request } from "../../services/api";

export const createServer = (data) => request(API.post("/servers", data));
export const joinServer = (data) => request(API.post("/servers/join", data));
export const getServers = () => request(API.get("/servers"));

export const deleteServer = (serverId) =>
  request(API.delete(`/servers/${serverId}`));
export const removeMember = (serverId, memberId) =>
  request(API.delete(`/servers/${serverId}/members/${memberId}`));
export const leaveServer = (serverId) =>
  request(API.post(`/servers/${serverId}/leave`));
