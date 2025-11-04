import { ok } from "../../utils/response.js";
import { defaultUserService } from "./user.service.js";

export function createUserController({ userService = defaultUserService } = {}) {
  if (!userService) {
    throw new Error("userService es requerido para crear el controlador de usuarios");
  }

  const getUsers = async (req, res, next) => {
    try {
      const users = await userService.listUsers();
      return ok(res, { data: { users } });
    } catch (error) {
      return next(error);
    }
  };

  const getUser = async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);
      return ok(res, { data: { user } });
    } catch (error) {
      return next(error);
    }
  };

  const searchUser = async (req, res, next) => {
    try {
      const users = await userService.searchUsersByUsername(req.query.username);
      return ok(res, { data: { users } });
    } catch (error) {
      return next(error);
    }
  };

  const proxyAvatar = async (req, res, next) => {
    try {
      const resource = await userService.getAvatarResource(req.params.id);

      if (resource.headers) {
        Object.entries(resource.headers).forEach(([header, value]) => {
          if (value !== undefined && value !== null) {
            res.setHeader(header, value);
          }
        });
      }

      if (resource.type === "buffer") {
        return res.send(resource.body);
      }

      if (resource.type === "stream" && resource.body?.pipe) {
        resource.body.on?.("error", next);
        return resource.body.pipe(res);
      }

      throw new Error("Tipo de recurso de avatar no soportado");
    } catch (error) {
      return next(error);
    }
  };

  const updateUsername = async (req, res, next) => {
    try {
      const updated = await userService.updateUsername({
        currentUser: req.user,
        username: req.body?.username,
      });

      return ok(res, {
        message: "Username actualizado",
        data: { user: updated },
      });
    } catch (error) {
      return next(error);
    }
  };

  const updateAvatar = async (req, res, next) => {
    try {
      const updated = await userService.updateAvatar({
        currentUser: req.user,
        avatar: req.body?.avatar,
      });

      return ok(res, {
        message: "Avatar actualizado",
        data: { user: updated },
      });
    } catch (error) {
      return next(error);
    }
  };

  return {
    getUsers,
    getUser,
    searchUser,
    proxyAvatar,
    updateUsername,
    updateAvatar,
  };
}

export const userController = createUserController();

export const {
  getUsers,
  getUser,
  searchUser,
  proxyAvatar,
  updateUsername,
  updateAvatar,
} = userController;

export default userController;
