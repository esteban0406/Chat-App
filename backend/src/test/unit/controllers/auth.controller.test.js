import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";

const UserMock = jest.fn();
UserMock.findOne = jest.fn();

const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const jwtMock = {
  sign: jest.fn(),
};

jest.unstable_mockModule("../../../services/user/User.model.js", () => ({
  __esModule: true,
  default: UserMock,
}));

jest.unstable_mockModule("bcryptjs", () => ({
  __esModule: true,
  default: bcryptMock,
  hash: bcryptMock.hash,
  compare: bcryptMock.compare,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: jwtMock,
  sign: jwtMock.sign,
}));

const { register, login } = await import("../../../controllers/auth.controller.js");

const createUserDoc = (overrides = {}) => {
  const doc = {
    _id: "user123",
    username: "test",
    email: "test@example.com",
    provider: "local",
    save: jest.fn().mockResolvedValue(undefined),
  };

  Object.assign(doc, overrides);

  doc.toObject =
    overrides.toObject ??
    jest.fn(() => ({
      _id: doc._id,
      username: doc.username,
      email: doc.email,
      provider: doc.provider,
    }));

  return doc;
};

describe("auth.controller", () => {
  let req;
  let res;
  let next;
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = "testsecret";

    jest.clearAllMocks();
    UserMock.mockReset();
    UserMock.findOne.mockReset();
    bcryptMock.hash.mockReset();
    bcryptMock.compare.mockReset();
    jwtMock.sign.mockReset();
  });

  describe("register", () => {
    test("retorna 400 si el usuario ya existe", async () => {
      req.body = { username: "test", email: "test@example.com", password: "pass" };
      UserMock.findOne.mockResolvedValue(createUserDoc());

      await register(req, res, next);

      expect(UserMock.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(409);
      expect(error.code).toBe("USER_EXISTS");
      expect(error.message).toBe("User already exists");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea un nuevo usuario y devuelve token", async () => {
      req.body = { username: "test", email: "test@example.com", password: "pass" };
      UserMock.findOne.mockResolvedValue(null);

      bcryptMock.hash.mockResolvedValue("hashed");
      const userDoc = createUserDoc({ save: jest.fn().mockResolvedValue(undefined) });
      UserMock.mockImplementation(() => userDoc);
      jwtMock.sign.mockReturnValue("token123");

      await register(req, res, next);

      expect(bcryptMock.hash).toHaveBeenCalledWith("pass", 10);
      expect(UserMock).toHaveBeenCalledWith({
        username: "test",
        email: "test@example.com",
        password: "hashed",
        provider: "local",
      });
      expect(userDoc.save).toHaveBeenCalled();
      expect(jwtMock.sign).toHaveBeenCalledWith({ id: "user123" }, "testsecret", {
        expiresIn: "1d",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User registered",
        data: {
          user: {
            id: "user123",
            username: "test",
            email: "test@example.com",
            provider: "local",
          },
          token: "token123",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { username: "test", email: "test@example.com", password: "pass" };
      const error = new Error("db down");
      UserMock.findOne.mockRejectedValue(error);

      await register(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    test("retorna 404 si el usuario no existe", async () => {
      req.body = { email: "missing@example.com", password: "pass" };
      UserMock.findOne.mockResolvedValue(null);

      await login(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("USER_NOT_FOUND");
      expect(error.message).toBe("User not found");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 401 si las credenciales son inválidas", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      const userDoc = createUserDoc({ password: "stored" });
      UserMock.findOne.mockResolvedValue(userDoc);
      bcryptMock.compare.mockResolvedValue(false);

      await login(req, res, next);

      expect(bcryptMock.compare).toHaveBeenCalledWith("pass", "stored");
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(401);
      expect(error.code).toBe("INVALID_CREDENTIALS");
      expect(error.message).toBe("Invalid credentials");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve token cuando las credenciales son válidas", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      const userDoc = createUserDoc({ password: "stored" });
      UserMock.findOne.mockResolvedValue(userDoc);
      bcryptMock.compare.mockResolvedValue(true);
      jwtMock.sign.mockReturnValue("token123");

      await login(req, res, next);

      expect(jwtMock.sign).toHaveBeenCalledWith({ id: "user123" }, "testsecret", {
        expiresIn: "1d",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Login exitoso",
        data: {
          token: "token123",
          user: {
            id: "user123",
            username: "test",
            email: "test@example.com",
            provider: "local",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      const error = new Error("lookup failed");
      UserMock.findOne.mockRejectedValue(error);

      await login(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
