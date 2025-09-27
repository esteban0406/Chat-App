import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const request = async (promise) => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export { API, request };
