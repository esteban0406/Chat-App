import { apiRequest, SERVER_BASE_URL } from "../../services/api";

export const registerUser = (data) => apiRequest("post", "/auth/register", data);
export const loginUser = (data) => apiRequest("post", "/auth/login", data);

export const loginWithGoogle = () => {
  window.location.href = `${SERVER_BASE_URL}/auth/google`;
};

export const loginWithMicrosoft = () => {
  window.location.href = `${SERVER_BASE_URL}/auth/microsoft`;
};
