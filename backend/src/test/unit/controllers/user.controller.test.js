import { jest } from "@jest/globals";

const UserMock = jest.fn();
UserMock.find = jest.fn();
UserMock.findById = jest.fn();
UserMock.findOne = jest.fn();

jest.unstable_mockModule("../../../models/User.js", () => ({
  __esModule: true,
  default: UserMock,
}));

const { getUsers, getUser, searchUser } = await import("../../../controllers/user.controller.js");

describe("user.controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    test("devuelve usuarios sin contraseña", async () => {
      const users = [{ _id: "user1" }, { _id: "user2" }];
      UserMock.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(users),
      });

      await getUsers(req, res, next);

      expect(UserMock.find).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith(users);
      expect(next).not.toHaveBeenCalled();
    });

    test("pasa errores al middleware", async () => {
      const error = new Error("lookup failed");
      UserMock.find.mockImplementation(() => {
        throw error;
      });

      await getUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getUser", () => {
    test("devuelve 404 cuando no existe el usuario", async () => {
      req.params = { id: "user123" };
      UserMock.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Usuario no encontrado" });
    });

    test("devuelve el usuario encontrado", async () => {
      req.params = { id: "user123" };
      const user = { _id: "user123", username: "Test" };
      UserMock.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      await getUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    test("pasa errores al middleware", async () => {
      const error = new Error("lookup failed");
      UserMock.findById.mockImplementation(() => {
        throw error;
      });

      await getUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("searchUser", () => {
    test("retorna 400 si falta username", async () => {
      req.query = {};

      await searchUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Debes proporcionar un username",
      });
    });

    test("retorna 404 si no se encuentra el usuario", async () => {
      req.query = { username: "test" };
      UserMock.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await searchUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Usuario no encontrado" });
    });

    test("devuelve el usuario cuando se encuentra", async () => {
      req.query = { username: "test" };
      const user = { _id: "user123", username: "Test" };
      UserMock.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      await searchUser(req, res);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.query = { username: "test" };
      const error = new Error("lookup failed");
      UserMock.findOne.mockImplementation(() => {
        throw error;
      });

      await searchUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
