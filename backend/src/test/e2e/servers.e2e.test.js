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

const registerUser = async (payload) => {
  const res = await request(app).post("/api/auth/register").send(payload);
  return { token: res.body.token, user: res.body.user };
};

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

const invalidAuthHeader = () => ({
  Authorization: "Bearer invalid-token",
});

const createServerForUser = async (token, body = {}) => {
  const res = await request(app)
    .post("/api/servers")
    .set(authHeader(token))
    .send({
      name: body.name ?? "Servidor de prueba",
      description: body.description ?? "Descripción",
    });

  return res;
};

describe("/api/servers E2E", () => {
  test("POST /api/servers crea servidor con canal por defecto", async () => {
    const { token, user } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
      password: "123456",
    });

    const res = await createServerForUser(token, {
      name: "Mi servidor",
      description: "Servidor principal",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Mi servidor",
      description: "Servidor principal",
      owner: user._id,
    });
    expect(res.body.members).toContain(user._id);
    expect(res.body.channels).toHaveLength(1);
    expect(res.body.defaultChannel).toMatchObject({
      name: "general",
      type: "text",
    });
  });

  test("GET /api/servers devuelve servidores del usuario autenticado", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
      password: "123456",
    });

    await createServerForUser(token);

    const res = await request(app)
      .get("/api/servers")
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty("name", "Servidor de prueba");
  });

  test("POST /api/servers/join agrega miembro si no existe", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
      password: "123456",
    });
    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const { user: member } = await registerUser({
      username: "member",
      email: "member@mail.com",
      password: "123456",
    });

    const res = await request(app).post("/api/servers/join").send({
      serverId,
      userId: member._id,
    });

    expect(res.status).toBe(200);
    const memberIds = res.body.members.map((id) => id.toString());
    expect(memberIds).toContain(member._id);
  });

  test("DELETE /api/servers/:serverId/members/:memberId permite al dueño eliminar miembro", async () => {
    const { token: ownerToken, user: owner } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
      password: "123456",
    });
    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const { user: member } = await registerUser({
      username: "member",
      email: "member@mail.com",
      password: "123456",
    });

    await request(app).post("/api/servers/join").send({
      serverId,
      userId: member._id,
    });

    const res = await request(app)
      .delete(`/api/servers/${serverId}/members/${member._id}`)
      .set(authHeader(ownerToken));

    expect(res.status).toBe(200);
    const memberIds = res.body.members.map((m) => m._id);
    expect(memberIds).toContain(owner._id);
    expect(memberIds).not.toContain(member._id);
  });

  test("POST /api/servers/:serverId/leave permite abandonar el servidor", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
      password: "123456",
    });
    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const { token: memberToken, user: member } = await registerUser({
      username: "member",
      email: "member@mail.com",
      password: "123456",
    });

    await request(app).post("/api/servers/join").send({
      serverId,
      userId: member._id,
    });

    const res = await request(app)
      .post(`/api/servers/${serverId}/leave`)
      .set(authHeader(memberToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Has salido del servidor" });

    const refreshed = await request(app)
      .get("/api/servers")
      .set(authHeader(memberToken));
    expect(refreshed.body).toHaveLength(0);
  });

  test("DELETE /api/servers/:serverId elimina el servidor y sus canales", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
      password: "123456",
    });
    const serverRes = await createServerForUser(token);
    const serverId = serverRes.body._id;

    const res = await request(app)
      .delete(`/api/servers/${serverId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Servidor eliminado con éxito" });

    const listRes = await request(app)
      .get("/api/servers")
      .set(authHeader(token));
    expect(listRes.body).toHaveLength(0);
  });

  test("POST /api/servers requiere token válido", async () => {
    const body = { name: "Secure Server", description: "desc" };

    const noTokenRes = await request(app).post("/api/servers").send(body);
    expect(noTokenRes.status).toBe(401);
    expect(noTokenRes.body).toHaveProperty("error", "No token provided");

    const invalidTokenRes = await request(app)
      .post("/api/servers")
      .set(invalidAuthHeader())
      .send(body);
    expect(invalidTokenRes.status).toBe(401);
    expect(invalidTokenRes.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });

  test("GET /api/servers requiere token válido", async () => {
    const res = await request(app).get("/api/servers");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "No token provided");

    const invalidRes = await request(app)
      .get("/api/servers")
      .set(invalidAuthHeader());
    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body).toHaveProperty("error", "Token inválido o expirado");
  });
});
