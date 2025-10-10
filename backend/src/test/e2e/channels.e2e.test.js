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

const registerUser = async ({ username, email }) => {
  const res = await request(app).post("/api/auth/register").send({
    username,
    email,
    password: "123456",
  });
  return { token: res.body.token, user: res.body.user };
};

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

const invalidAuthHeader = () => ({
  Authorization: "Bearer invalid-token",
});

const createServerForUser = async (token, body = {}) =>
  request(app)
    .post("/api/servers")
    .set(authHeader(token))
    .send({
      name: body.name ?? "Servidor Base",
      description: body.description ?? "desc",
    });

const createChannel = (token, payload) =>
  request(app)
    .post("/api/channels")
    .set(authHeader(token))
    .send(payload);

describe("/api/channels E2E", () => {
  test("POST /api/channels crea un canal cuando el usuario es miembro", async () => {
    const { token, user } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;

    const res = await createChannel(token, {
      name: "voz",
      type: "voice",
      serverId,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "voz",
      type: "voice",
      server: serverId,
    });

    const list = await request(app)
      .get(`/api/channels/${serverId}`)
      .set(authHeader(token));
    expect(list.body.map((c) => c.name)).toContain("voz");
    expect(list.body.map((c) => c.name)).toContain("general");
  });

  test("POST /api/channels rechaza crear canal si falta nombre o serverId", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });

    const res = await createChannel(token, { name: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "error",
      "El nombre y el serverId son requeridos"
    );
  });

  test("POST /api/channels rechaza si el usuario no es miembro", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const { token: otherToken } = await registerUser({
      username: "other",
      email: "other@mail.com",
    });

    const res = await createChannel(otherToken, {
      name: "nuevo",
      serverId,
    });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      "error",
      "No eres miembro de este servidor"
    );
  });

  test("GET /api/channels/:serverId devuelve canales cuando el usuario pertenece", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;

    await createChannel(token, { name: "chat", serverId });

    const res = await request(app)
      .get(`/api/channels/${serverId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((c) => c.name)).toEqual(
      expect.arrayContaining(["general", "chat"])
    );
  });

  test("GET /api/channels/:serverId devuelve 403 cuando el usuario no pertenece", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const { token } = await registerUser({
      username: "other",
      email: "other@mail.com",
    });

    const res = await request(app)
      .get(`/api/channels/${serverId}`)
      .set(authHeader(token));

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty(
      "error",
      "No eres miembro de este servidor"
    );
  });

  test("DELETE /api/channels/:channelId elimina el canal", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;

    const channelRes = await createChannel(token, {
      name: "temporal",
      serverId,
    });

    const deleteRes = await request(app)
      .delete(`/api/channels/${channelRes.body._id}`)
      .set(authHeader(token));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({
      message: "Canal eliminado correctamente",
      channelId: channelRes.body._id,
    });

    const list = await request(app)
      .get(`/api/channels/${serverId}`)
      .set(authHeader(token));
    expect(list.body.map((c) => c.name)).not.toContain("temporal");
  });

  test("POST /api/channels requiere autenticación", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;

    const payload = { name: "seguro", serverId };

    const noTokenRes = await request(app).post("/api/channels").send(payload);
    expect(noTokenRes.status).toBe(401);
    expect(noTokenRes.body).toHaveProperty("error", "No token provided");

    const invalidTokenRes = await request(app)
      .post("/api/channels")
      .set(invalidAuthHeader())
      .send(payload);
    expect(invalidTokenRes.status).toBe(401);
    expect(invalidTokenRes.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });

  test("GET /api/channels/:serverId requiere autenticación", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;

    const noTokenRes = await request(app).get(`/api/channels/${serverId}`);
    expect(noTokenRes.status).toBe(401);
    expect(noTokenRes.body).toHaveProperty("error", "No token provided");

    const invalidRes = await request(app)
      .get(`/api/channels/${serverId}`)
      .set(invalidAuthHeader());
    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body).toHaveProperty("error", "Token inválido o expirado");
  });

  test("DELETE /api/channels/:channelId requiere autenticación", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;
    const channelRes = await createChannel(token, {
      name: "secure-delete",
      serverId,
    });

    const noTokenRes = await request(app).delete(
      `/api/channels/${channelRes._id}`
    );
    expect(noTokenRes.status).toBe(401);
    expect(noTokenRes.body).toHaveProperty("error", "No token provided");

    const invalidTokenRes = await request(app)
      .delete(`/api/channels/${channelRes._id}`)
      .set(invalidAuthHeader());
    expect(invalidTokenRes.status).toBe(401);
    expect(invalidTokenRes.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });
});
