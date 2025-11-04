import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";

const UserMock = jest.fn();
UserMock.find = jest.fn();
UserMock.findById = jest.fn();
UserMock.findOne = jest.fn(); // kept for completeness if other controllers reuse

jest.unstable_mockModule("../../../services/user/User.model.js", () => ({
  __esModule: true,
  default: UserMock,
}));

const { getUsers, getUser, searchUser } = await import("../../../services/user/user.controller.js");

const createUserDoc = (overrides = {}) => {
  const doc = {
    _id: "user123",
    username: "Test",
    email: "test@example.com",
    provider: "local",
    toObject: jest.fn(),
  };

  Object.assign(doc, overrides);

  if (!doc.toObject.mock) {
    doc.toObject = jest.fn(() => ({
      _id: doc._id,
      username: doc.username,
      email: doc.email,
      provider: doc.provider,
    }));
  } else if (!doc.toObject.mock.calls.length) {
    doc.toObject.mockImplementation(() => ({
      _id: doc._id,
      username: doc.username,
      email: doc.email,
      provider: doc.provider,
    }));
  }

  return doc;
};

const createFindQuery = (result) => {
  const selectFn = jest.fn();
  const limitFn = jest.fn().mockResolvedValue(result);
  selectFn.mockReturnValue({ limit: limitFn });
  return { select: selectFn };
};

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
    UserMock.find.mockReset();
    UserMock.findById.mockReset();
    UserMock.findOne.mockReset();
  });

  describe("getUsers", () => {
    test("devuelve usuarios sin contraseña", async () => {
      const users = [createUserDoc({ _id: "user1" }), createUserDoc({ _id: "user2" })];
      UserMock.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(users),
      });

      await getUsers(req, res, next);

      expect(UserMock.find).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          users: [
            { id: "user1", username: "Test", email: "test@example.com", provider: "local" },
            { id: "user2", username: "Test", email: "test@example.com", provider: "local" },
          ],
        },
      });
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
    test("retorna 404 cuando no existe el usuario", async () => {
      req.params = { id: "user123" };
      UserMock.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("USER_NOT_FOUND");
      expect(error.message).toBe("Usuario no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve el usuario encontrado", async () => {
      req.params = { id: "user123" };
      const user = createUserDoc({ _id: "user123", username: "Test" });
      UserMock.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      await getUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          user: {
            id: "user123",
            username: "Test",
            email: "test@example.com",
            provider: "local",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
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

      await searchUser(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Debes proporcionar un username");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 404 si no se encuentra el usuario", async () => {
      req.query = { username: "test" };
      UserMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      await searchUser(req, res, next);

      expect(UserMock.find).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("USER_NOT_FOUND");
      expect(error.message).toBe("Usuario no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve los usuarios cuando se encuentran coincidencias", async () => {
      req.query = { username: "test" };
      const matchedUsers = [
        createUserDoc({ _id: "user123", username: "Tester" }),
        createUserDoc({ _id: "user456", username: "Testing" }),
      ];
      UserMock.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(matchedUsers),
        }),
      });

      await searchUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          users: [
            {
              id: "user123",
              username: "Tester",
              email: "test@example.com",
              provider: "local",
            },
            {
              id: "user456",
              username: "Testing",
              email: "test@example.com",
              provider: "local",
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.query = { username: "test" };
      const error = new Error("lookup failed");
      UserMock.find.mockImplementation(() => {
        throw error;
      });

      await searchUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
