import { API, request } from "../../services/api";

export const getUsers = () => request(API.get("/users"));
export const searchUser = (username) =>
  request(API.get(`/users/search?username=${username}`));
