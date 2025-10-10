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
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    res.body.forEach((user) => {
      expect(user).toHaveProperty("_id");
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

    const userId = createRes.body.user._id;
    const res = await request(app).get(`/api/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      _id: userId,
      username: "singleuser",
      email: "single@mail.com",
    });
    expect(res.body).not.toHaveProperty("password");
  });

  test("GET /api/users/:id retorna 404 cuando el usuario no existe", async () => {
    const res = await request(app).get(
      `/api/users/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Usuario no encontrado");
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
    expect(res.body).toMatchObject({
      username: "SearchUser",
      email: "search@mail.com",
    });
    expect(res.body).not.toHaveProperty("password");
  });

  test("GET /api/users/search retorna 400 cuando falta el username", async () => {
    const res = await request(app).get("/api/users/search");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Debes proporcionar un username");
  });

  test("GET /api/users/search retorna 404 cuando no encuentra coincidencias", async () => {
    const res = await request(app)
      .get("/api/users/search")
      .query({ username: "unknown" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Usuario no encontrado");
  });
});
