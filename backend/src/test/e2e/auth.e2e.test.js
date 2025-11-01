import request from "supertest";
import User from "../../models/User.js";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../../../test/helpers/e2eServer.js";

let app;

const expectOk = (res, status) => {
  expect(res.status).toBe(status);
  expect(res.body.success).toBe(true);
  return res.body.data;
};

const expectFail = (res, status, message) => {
  expect(res.status).toBe(status);
  expect(res.body).toMatchObject({
    success: false,
    message,
  });
};

beforeAll(async () => {
  ({ app } = await startE2EServer());
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await stopE2EServer();
});

describe("Auth E2E", () => {
  test("✅ Debe registrar un usuario y devolver un token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@mail.com",
        password: "123456",
      });

    const data = expectOk(res, 201);
    expect(data).toMatchObject({
      token: expect.any(String),
      user: expect.objectContaining({
        username: "testuser",
        email: "test@mail.com",
        provider: "local",
      }),
    });
  });

  test("❌ Debe rechazar registro con email duplicado", async () => {
    const payload = {
      username: "dupuser",
      email: "dup@mail.com",
      password: "123456",
    };

    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...payload, username: "dupuser2" });

    expectFail(res, 409, "User already exists");
  });

  test("✅ Debe loguear un usuario existente", async () => {
    await request(app).post("/api/auth/register").send({
      username: "loginuser",
      email: "login@mail.com",
      password: "123456",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@mail.com",
        password: "123456",
      });

    const data = expectOk(res, 200);
    expect(data).toMatchObject({
      token: expect.any(String),
      user: expect.objectContaining({
        email: "login@mail.com",
        username: "loginuser",
      }),
    });
  });

  test("❌ Debe rechazar login con usuario inexistente", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "missing@mail.com",
      password: "123456",
    });

    expectFail(res, 404, "User not found");
  });

  test("❌ Debe rechazar login con contraseña inválida", async () => {
    await request(app).post("/api/auth/register").send({
      username: "invalidpass",
      email: "invalidpass@mail.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "invalidpass@mail.com",
      password: "wrongpass",
    });

    expectFail(res, 401, "Invalid credentials");
  });

  test("❌ Debe rechazar registro local sin contraseña", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "nopassuser",
      email: "nopass@mail.com",
    });

    expectFail(res, 400, "Password requerido para registro local");
  });

  test("✅ Debe permitir crear un usuario OAuth sin password en DB", async () => {
    const oauthUser = new User({
      username: "googleUser",
      email: "googleuser@mail.com",
      provider: "google",
      avatar: "https://picsum.photos/200",
    });

    const saved = await oauthUser.save();

    expect(saved._id).toBeDefined();
    expect(saved.password).toBeUndefined();
    expect(saved.provider).toBe("google");
    expect(saved.avatar).toContain("http");
  });
});
