import axios from "axios";

const baseURL ="/api";

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// Interceptor para añadir token JWT si existe
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ========================
   🔹 Auth
======================== */
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);

/* ========================
   🔹 Users
======================== */
export const getUsers = () => API.get("/users");
export const searchUser = (username) =>
  API.get(`/users/search?username=${username}`);

/* ========================
   🔹 Servers
======================== */
export const createServer = (data) => API.post("/servers", data);
export const joinServer = (data) => API.post("/servers/join", data);
export const getServers = () => API.get("/servers");
export const getServerInvites = () => API.get("/invites/pending");
export const sendServerInvite = (data) => API.post("/invites/send", data);
export const acceptServerInvite = (inviteId) =>
  API.post(`/invites/accept/${inviteId}`);
export const rejectServerInvite = (inviteId) =>
  API.post(`/invites/reject/${inviteId}`);
export const deleteServer = (serverId) => API.delete(`/servers/${serverId}`);
export const editServer = (serverId, data) =>
  API.put(`/servers/${serverId}`, data);
export const leaveServer = (serverId) => API.post(`/servers/${serverId}/leave`);

/* ========================
   🔹 Channels
======================== */
export const createChannel = (data) => {
  return API.post("/channels", data);
};
export const getChannels = (serverId) => API.get(`/channels/${serverId}`);
export const deleteChannel = (channelId) =>
  API.delete(`/channels/${channelId}`);

/* ========================
   🔹 Messages
======================== */
export const sendMessage = (data) => API.post("/messages", data);
export const getMessages = (channelId) => API.get(`/messages/${channelId}`);

/* ========================
   🔹 Friend Invites
======================== */
export const getFriendInvites = () => API.get("/friends/pending");
export const sendFriendInvite = (data) => API.post("/friends/send", data);
export const acceptFriendInvite = (inviteId) =>
  API.post(`/friends/respond/${inviteId}`, { status: "accepted" });
export const rejectFriendInvite = (inviteId) =>
  API.post(`/friends/respond/${inviteId}`, { status: "rejected" });
export const getFriends = () => API.get("/friends/list");

<<<<<<< HEAD
/* ========================
   🔹 Server Invites
======================== */

=======
>>>>>>> Test
export default API;
