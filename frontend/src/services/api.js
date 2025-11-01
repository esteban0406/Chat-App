import axios from "axios";

const RAW_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TRIMMED_BASE_URL = RAW_BASE_URL.replace(/\/$/, "");
const API_BASE_URL = TRIMMED_BASE_URL.endsWith("/api")
  ? TRIMMED_BASE_URL
  : `${TRIMMED_BASE_URL}/api`;
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export { API_BASE_URL, SERVER_BASE_URL };

export const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const request = async (promise) => {
  try {
    const { data } = await promise;
    return data?.data ?? data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiRequest = (method, path, data) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return request(API[method.toLowerCase()](normalizedPath, data));
};
