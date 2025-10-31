import { API, request } from "../../services/api";

export const getUsers = () => request(API.get("/users"));
export const searchUser = async (username) => {
  const data = await request(
    API.get("/users/search", {
      params: { username },
    })
  );

  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data)) return data;
  if (data?.user) return [data.user];
  return [];
};
export const updateProfileName = (username) =>
  request(API.patch("/users/me", { username }));
export const updateProfileAvatar = (avatar) =>
  request(API.patch("/users/me/avatar", { avatar }));
