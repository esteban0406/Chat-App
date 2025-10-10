import { jest } from "@jest/globals";

const UserMock = jest.fn();
UserMock.findOne = jest.fn();

const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const jwtMock = {
  sign: jest.fn(),
};

jest.unstable_mockModule("../../../models/User.js", () => ({
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

describe("auth.controller", () => {
  let req;
  let res;
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
    process.env.JWT_SECRET = "testsecret";
    jest.clearAllMocks();
  });

  describe("register", () => {
    test("retorna 400 si el usuario ya existe", async () => {
      req.body = { username: "test", email: "test@example.com", password: "pass" };
      UserMock.findOne.mockResolvedValue({ _id: "user123" });

      await register(req, res);

      expect(UserMock.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });

    test("crea un nuevo usuario y devuelve token", async () => {
      req.body = { username: "test", email: "test@example.com", password: "pass" };
      UserMock.findOne.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue("hashed");
      const saveMock = jest.fn().mockResolvedValue(true);
      const userDoc = { _id: "user123", save: saveMock };
      UserMock.mockImplementation(() => userDoc);
      jwtMock.sign.mockReturnValue("token123");

      await register(req, res);

      expect(bcryptMock.hash).toHaveBeenCalledWith("pass", 10);
      expect(UserMock).toHaveBeenCalledWith({
        username: "test",
        email: "test@example.com",
        password: "hashed",
      });
      expect(saveMock).toHaveBeenCalled();
      expect(jwtMock.sign).toHaveBeenCalledWith({ id: "user123" }, "testsecret", {
        expiresIn: "1d",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered",
        user: userDoc,
        token: "token123",
      });
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { username: "test", email: "test@example.com", password: "pass" };
      const error = new Error("db down");
      UserMock.findOne.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("login", () => {
    test("retorna 404 si el usuario no existe", async () => {
      req.body = { email: "missing@example.com", password: "pass" };
      UserMock.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    test("retorna 401 si las credenciales son inválidas", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      const userDoc = { _id: "user123", password: "stored" };
      UserMock.findOne.mockResolvedValue(userDoc);
      bcryptMock.compare.mockResolvedValue(false);

      await login(req, res);

      expect(bcryptMock.compare).toHaveBeenCalledWith("pass", "stored");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    test("devuelve token cuando las credenciales son válidas", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      const userDoc = { _id: "user123", password: "stored" };
      UserMock.findOne.mockResolvedValue(userDoc);
      bcryptMock.compare.mockResolvedValue(true);
      jwtMock.sign.mockReturnValue("token123");

      await login(req, res);

      expect(jwtMock.sign).toHaveBeenCalledWith({ id: "user123" }, "testsecret", {
        expiresIn: "1d",
      });
      expect(res.json).toHaveBeenCalledWith({ token: "token123", user: userDoc });
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      const error = new Error("lookup failed");
      UserMock.findOne.mockRejectedValue(error);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
