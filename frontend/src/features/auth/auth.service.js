import { API, request } from "../../services/api";

export const registerUser = (data) => request(API.post("/auth/register", data));
export const loginUser = (data) => request(API.post("/auth/login", data));
