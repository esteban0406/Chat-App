import axios from "axios";

// Base URL de tu backend (ajústala según Docker/prod)
const API = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true, // importante si usas cookies/sesiones
});

// Interceptor para añadir token JWT si existe
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // guardado en login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

/* ========================
   🔹 Funciones Auth
======================== */
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);

/* ========================
   🔹 Users
======================== */
export const getUsers = () => API.get("/users");

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
