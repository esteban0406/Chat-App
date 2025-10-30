import { API, request } from "../../services/api";

export const getUsers = () => request(API.get("/users"));
export const searchUser = (username) =>
  request(API.get(`/users/search?username=${username}`));
export const updateProfileName = (username) =>
  request(API.patch("/users/me", { username }));
export const updateProfileAvatar = (avatar) =>
  request(API.patch("/users/me/avatar", { avatar }));
