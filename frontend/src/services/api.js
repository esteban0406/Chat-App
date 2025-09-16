import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
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
export const searchUser = (username) => API.get(`/users/search?username=${username}`);

/* ========================
   🔹 Servers
======================== */
export const createServer = (data) => API.post("/servers", data);
export const joinServer = (data) => API.post("/servers/join", data);
export const getServers = () => API.get("/servers");

/* ========================
   🔹 Channels
======================== */
export const createChannel = (data) => API.post("/channels", data);
export const getChannels = (serverId) => API.get(`/channels/${serverId}`);

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

/* ========================
   🔹 Server Invites
======================== */
export const getServerInvites = () => API.get("/invites/pending");
export const sendServerInvite = (data) => API.post("/invites/send", data);
export const respondServerInvite = (data) => API.post("/invites/respond", data);

export default API;
