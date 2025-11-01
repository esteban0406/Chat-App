import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

export const API = axios.create({
  baseURL: BASE_URL, 
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
  const url = `/api${path.startsWith("/") ? path : `/${path}`}`;
  return request(API[method.toLowerCase()](url, data));
};
