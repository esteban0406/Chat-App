import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let app, server, mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "testsecret";

  // 👇 Importamos después de setear el env
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

describe("Auth E2E", () => {
  test("Debe registrar un usuario y devolver un token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@mail.com",
        password: "123456",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("username", "testuser");
  });

  test("Debe rechazar registro con email duplicado", async () => {
    const payload = {
      username: "dupuser",
      email: "dup@mail.com",
      password: "123456",
    };

    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app).post("/api/auth/register").send({
      ...payload,
      username: "dupuser2",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "User already exists");
  });

  test("Debe loguear un usuario existente", async () => {
    // primero registrar
    await request(app).post("/api/auth/register").send({
      username: "loginuser",
      email: "login@mail.com",
      password: "123456",
    });

    // luego loguear
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@mail.com",
        password: "123456",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("Debe rechazar login con usuario inexistente", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "missing@mail.com",
      password: "123456",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "User not found");
  });

  test("Debe rechazar login con contraseña inválida", async () => {
    await request(app).post("/api/auth/register").send({
      username: "invalidpass",
      email: "invalidpass@mail.com",
      password: "123456",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "invalidpass@mail.com",
      password: "wrongpass",
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid credentials");
  });
});
