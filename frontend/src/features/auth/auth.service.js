import { API, request } from "../../services/api";

export const registerUser = (data) => request(API.post("/auth/register", data));
export const loginUser = (data) => request(API.post("/auth/login", data));

export const loginWithGoogle = () => {
  window.location.href = `${API.defaults.baseURL}/auth/google`;
};

export const loginWithMicrosoft = () => {
  window.location.href = `${API.defaults.baseURL}/auth/microsoft`;
};
