// src/services/user/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { ok } from "../../utils/response.js";
import { defaultUserService, UserService } from "./user.service.js";

interface UserControllerDeps {
  userService?: UserService;
}

export function createUserController({
  userService = defaultUserService,
}: UserControllerDeps = {}) {
  if (!userService) {
    throw new Error(
      "userService es requerido para crear el controlador de usuarios"
    );
  }

  const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.listUsers({
        authContext: req.authContext,
      });
      return ok(res, { data: { users } });
    } catch (error) {
      return next(error);
    }
  };

  const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.getUserById(req.params.id, {
        authContext: req.authContext,
      });
      return ok(res, { data: { user } });
    } catch (error) {
      return next(error);
    }
  };

  const searchUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.searchUsersByUsername(
        req.query.username as string,
        { authContext: req.authContext }
      );
      return ok(res, { data: { users } });
    } catch (error) {
      return next(error);
    }
  };

  const proxyAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resource = await userService.getAvatarResource(req.params.id, {
        authContext: req.authContext,
      });

      if (resource.headers) {
        Object.entries(resource.headers).forEach(([header, value]) => {
          if (value !== undefined && value !== null) {
            res.setHeader(header, String(value));
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

  const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await userService.updateUser({
        currentUser: req.user!,
        name: req.body?.name,
        username: req.body?.username,
        image: req.body?.image ?? req.body?.avatar,
        authContext: req.authContext,
      });

      return ok(res, {
        message: "Usuario actualizado",
        data: { user: updated },
      });
    } catch (error) {
      return next(error);
    }
  };

  const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await userService.updateStatus({
        currentUser: req.user!,
        status: req.body?.status,
        authContext: req.authContext,
      });

      return ok(res, {
        message: "Status actualizado",
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
    updateUser,
    updateStatus,
  };
}

export const userController = createUserController();

export const {
  getUsers,
  getUser,
  searchUser,
  proxyAvatar,
  updateUser,
  updateStatus,
} = userController;

export default userController;
