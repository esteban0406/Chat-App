import { API, apiRequest } from "../../services/api";

/**
 * 🧩 Classic authentication (JSON)
 */
export const registerUser = (data) => apiRequest("post", "/auth/register", data);
export const loginUser = (data) => apiRequest("post", "/auth/login", data);

/**
 * 🌐 OAuth (browser redirects)
 */
export const loginWithGoogle = () => {
  const base = API.defaults.baseURL.replace(/\/$/, ""); // remove trailing slash
  window.location.href = `${base}/auth/google`; // ✅ no /api here
};

export const loginWithMicrosoft = () => {
  const base = API.defaults.baseURL.replace(/\/$/, "");
  window.location.href = `${base}/auth/microsoft`;
};
