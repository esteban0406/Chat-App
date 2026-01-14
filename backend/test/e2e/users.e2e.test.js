import request from "supertest";
import { Types } from "mongoose";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../helpers/e2eServer.js";
import { createBetterAuthTestUser } from "../helpers/betterAuthTestUtils.js";

let app;

beforeAll(async () => {
  ({ app } = await startE2EServer());
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await stopE2EServer();
});

const registerUser = ({ username, email }) =>
  createBetterAuthTestUser({ username, email });

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

describe("/api/users E2E", () => {
  test("GET /api/users retorna la lista de usuarios sin contraseñas", async () => {
    const { token } = await registerUser({
      username: "user1",
      email: "user1@mail.com",
    });
    await registerUser({
      username: "user2",
      email: "user2@mail.com",
    });

    const res = await request(app)
      .get("/api/users")
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    const { users } = res.body.data;
    expect(Array.isArray(users)).toBe(true);
    expect(users).toHaveLength(2);
    users.forEach((user) => {
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("email");
      expect(user).not.toHaveProperty("password");
    });
  });

  test("GET /api/users/:id retorna un usuario existente", async () => {
    const { user: createdUser, token } = await registerUser({
      username: "singleuser",
      email: "single@mail.com",
    });
    const userId = createdUser.id;
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data.user).toMatchObject({
      id: userId,
      username: "singleuser",
      email: "single@mail.com",
    });
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  test("GET /api/users/:id retorna 404 cuando el usuario no existe", async () => {
    const { token } = await registerUser({
      username: "auth",
      email: "auth@mail.com",
    });
    // Use a valid-looking ID that doesn't exist
    const nonExistentId = "nonexistent-user-id-12345";
    const res = await request(app)
      .get(`/api/users/${nonExistentId}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Usuario no encontrado",
    });
  });

  test("GET /api/users/search busca por username ignorando mayúsculas", async () => {
    const { token } = await registerUser({
      username: "searchuser",
      email: "search@mail.com",
    });

    const res = await request(app)
      .get("/api/users/search")
      .set(authHeader(token))
      .query({
        username: "searchuser",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    const { users } = res.body.data;
    expect(Array.isArray(users)).toBe(true);
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: "search@mail.com",
        }),
      ])
    );
    users.forEach((user) => {
      expect(user).not.toHaveProperty("password");
    });
  });

  test("GET /api/users/search retorna 400 cuando falta el username", async () => {
    const { token } = await registerUser({
      username: "auth",
      email: "auth-user@mail.com",
    });
    const res = await request(app)
      .get("/api/users/search")
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Debes proporcionar un username",
    });
  });

  test("GET /api/users/search retorna 404 cuando no encuentra coincidencias", async () => {
    const { token } = await registerUser({
      username: "auth",
      email: "auth-user@mail.com",
    });
    const res = await request(app)
      .get("/api/users/search")
      .set(authHeader(token))
      .query({ username: "unknown" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Usuario no encontrado",
    });
  });
});
