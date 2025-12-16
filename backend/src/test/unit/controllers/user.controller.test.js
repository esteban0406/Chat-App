import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";
import { createUserController } from "../../../services/user/user.controller.js";

describe("user.controller", () => {
  let userService;
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    userService = {
      listUsers: jest.fn(),
      getUserById: jest.fn(),
      searchUsersByUsername: jest.fn(),
      getAvatarResource: jest.fn(),
      updateUsername: jest.fn(),
      updateAvatar: jest.fn(),
    };

    controller = createUserController({ userService });
    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  describe("getUsers", () => {
    test("devuelve usuarios proporcionados por el servicio", async () => {
      const users = [
        { id: "user1", username: "Test1", email: "test1@example.com" },
        { id: "user2", username: "Test2", email: "test2@example.com" },
      ];
      userService.listUsers.mockResolvedValue(users);

      await controller.getUsers(req, res, next);

      expect(userService.listUsers).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: { users },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("propaga errores del servicio", async () => {
      const error = new Error("lookup failed");
      userService.listUsers.mockRejectedValue(error);

      await controller.getUsers(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getUser", () => {
    test("retorna el usuario solicitado", async () => {
      const user = { id: "user123", username: "Tester", email: "test@example.com" };
      userService.getUserById.mockResolvedValue(user);
      req.params.id = "user123";

      await controller.getUser(req, res, next);

      expect(userService.getUserById).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: { user },
      });
    });

    test("propaga errores del servicio", async () => {
      const error = new HttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
      userService.getUserById.mockRejectedValue(error);
      req.params.id = "missing";

      await controller.getUser(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("searchUser", () => {
    test("retorna usuarios cuando el servicio encuentra coincidencias", async () => {
      const users = [{ id: "u1", username: "SearchUser", email: "search@example.com" }];
      userService.searchUsersByUsername.mockResolvedValue(users);
      req.query.username = "search";

      await controller.searchUser(req, res, next);

      expect(userService.searchUsersByUsername).toHaveBeenCalledWith("search");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: { users },
      });
    });

    test("propaga errores cuando el servicio falla", async () => {
      const error = new HttpError(404, "Usuario no encontrado", { code: "USER_NOT_FOUND" });
      userService.searchUsersByUsername.mockRejectedValue(error);
      req.query.username = "missing";

      await controller.searchUser(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("proxyAvatar", () => {
    test("envía cuerpos tipo buffer con encabezados", async () => {
      const resource = {
        type: "buffer",
        body: Buffer.from("avatar"),
        headers: { "Content-Type": "image/png" },
      };
      userService.getAvatarResource.mockResolvedValue(resource);
      req.params.id = "user123";

      await controller.proxyAvatar(req, res, next);

      expect(userService.getAvatarResource).toHaveBeenCalledWith("user123");
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
      expect(res.send).toHaveBeenCalledWith(resource.body);
    });

    test("propaga errores del servicio", async () => {
      const error = new HttpError(404, "Avatar no disponible", { code: "AVATAR_NOT_FOUND" });
      userService.getAvatarResource.mockRejectedValue(error);
      req.params.id = "user123";

      await controller.proxyAvatar(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
