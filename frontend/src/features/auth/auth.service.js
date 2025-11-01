import { API, request } from "../../services/api";

export const registerUser = (data) =>
  request(API.post("/api/auth/register", data));
export const loginUser = (data) => request(API.post("/api/auth/login", data));

export const loginWithGoogle = () => {
  const base = API.defaults.baseURL?.replace(/\/$/, "");
  window.location.href = `${base}/auth/google`;
};

export const loginWithMicrosoft = () => {
  const base = API.defaults.baseURL?.replace(/\/$/, "");
  window.location.href = `${base}/auth/microsoft`;
};
