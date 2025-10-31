import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let app;
let server;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "testsecret";

  const { createServer } = await import("../../server.js");
  const result = await createServer();
  app = result.app;
  server = result.server;
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  if (server) server.close();
});

const registerUser = (payload) =>
  request(app).post("/api/auth/register").send(payload);

describe("/api/users E2E", () => {
  test("GET /api/users retorna la lista de usuarios sin contraseñas", async () => {
    await registerUser({
      username: "user1",
      email: "user1@mail.com",
      password: "123456",
    });
    await registerUser({
      username: "user2",
      email: "user2@mail.com",
      password: "123456",
    });

    const res = await request(app).get("/api/users");

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
    const createRes = await registerUser({
      username: "singleuser",
      email: "single@mail.com",
      password: "123456",
    });

    expect(createRes.status).toBe(201);
    const { user: createdUser } = createRes.body.data;
    const userId = createdUser.id;
    const res = await request(app).get(`/api/users/${userId}`);

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
    const res = await request(app).get(
      `/api/users/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Usuario no encontrado",
    });
  });

  test("GET /api/users/search busca por username ignorando mayúsculas", async () => {
    await registerUser({
      username: "SearchUser",
      email: "search@mail.com",
      password: "123456",
    });

    const res = await request(app).get("/api/users/search").query({
      username: "searchuser",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    const { users } = res.body.data;
    expect(Array.isArray(users)).toBe(true);
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          username: "SearchUser",
          email: "search@mail.com",
        }),
      ])
    );
    users.forEach((user) => {
      expect(user).not.toHaveProperty("password");
    });
  });

  test("GET /api/users/search retorna 400 cuando falta el username", async () => {
    const res = await request(app).get("/api/users/search");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Debes proporcionar un username",
    });
  });

  test("GET /api/users/search retorna 404 cuando no encuentra coincidencias", async () => {
    const res = await request(app)
      .get("/api/users/search")
      .query({ username: "unknown" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Usuario no encontrado",
    });
  });
});
