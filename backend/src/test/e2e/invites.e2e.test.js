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

const sendInvite = ({ token, to, serverId }) =>
  request(app)
    .post("/api/invites/send")
    .set(authHeader(token))
    .send({ to, serverId });

describe("/api/invites E2E", () => {
  test("permite enviar y aceptar una invitación de servidor", async () => {
    const { token: ownerToken, user: owner } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const { token: invitedToken, user: invited } = await registerUser({
      username: "invited",
      email: "invited@mail.com",
    });

    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const sendRes = await sendInvite({
      token: ownerToken,
      to: invited._id,
      serverId,
    });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body).toMatchObject({
      from: owner._id,
      to: invited._id,
      server: serverId,
      status: "pending",
    });

    const pendingRes = await request(app)
      .get("/api/invites/pending")
      .set(authHeader(invitedToken));

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0].status).toBe("pending");
    expect(pendingRes.body[0].server.name).toBe("Servidor Base");

    const acceptRes = await request(app)
      .post(`/api/invites/accept/${sendRes.body._id}`)
      .set(authHeader(invitedToken));

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body).toMatchObject({ success: true });
    expect(acceptRes.body.invite.status).toBe("accepted");

    const serversRes = await request(app)
      .get("/api/servers")
      .set(authHeader(invitedToken));

    expect(serversRes.body).toHaveLength(1);
    const memberIds = serversRes.body[0].members.map((m) =>
      m._id ? m._id.toString() : m.toString()
    );
    expect(memberIds).toContain(invited._id);
  });

  test("rechazar invitación no agrega al servidor", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const { token: invitedToken, user: invited } = await registerUser({
      username: "invited",
      email: "invited@mail.com",
    });

    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    const sendRes = await sendInvite({
      token: ownerToken,
      to: invited._id,
      serverId,
    });

    const rejectRes = await request(app)
      .post(`/api/invites/reject/${sendRes.body._id}`)
      .set(authHeader(invitedToken));

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.invite.status).toBe("rejected");

    const serversRes = await request(app)
      .get("/api/servers")
      .set(authHeader(invitedToken));
    expect(serversRes.body).toEqual([]);
  });

  test("evita enviar invitaciones duplicadas pendientes", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const { user: invited } = await registerUser({
      username: "invited",
      email: "invited@mail.com",
    });
    const serverRes = await createServerForUser(ownerToken);

    await sendInvite({
      token: ownerToken,
      to: invited._id,
      serverId: serverRes.body._id,
    });

    const duplicateRes = await sendInvite({
      token: ownerToken,
      to: invited._id,
      serverId: serverRes.body._id,
    });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body).toHaveProperty(
      "error",
      "Ya existe una invitación pendiente a este usuario para este servidor"
    );
  });

  test("listar pendientes ignora invitaciones de servidores eliminados", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const { token: invitedToken, user: invited } = await registerUser({
      username: "invited",
      email: "invited@mail.com",
    });

    const serverRes = await createServerForUser(ownerToken);
    const serverId = serverRes.body._id;

    await sendInvite({
      token: ownerToken,
      to: invited._id,
      serverId,
    });

    await request(app)
      .delete(`/api/servers/${serverId}`)
      .set(authHeader(ownerToken));

    const pendingRes = await request(app)
      .get("/api/invites/pending")
      .set(authHeader(invitedToken));

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toEqual([]);
  });

  test("responder invitación inexistente devuelve 404", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });

    const res = await request(app)
      .post(`/api/invites/accept/${new mongoose.Types.ObjectId()}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Invitación no encontrada");
  });

  test("requiere autenticación para enviar invitaciones", async () => {
    const resNoToken = await request(app).post("/api/invites/send").send({
      to: new mongoose.Types.ObjectId().toString(),
      serverId: new mongoose.Types.ObjectId().toString(),
    });
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body).toHaveProperty("error", "No token provided");

    const resInvalid = await request(app)
      .post("/api/invites/send")
      .set(invalidAuthHeader())
      .send({
        to: new mongoose.Types.ObjectId().toString(),
        serverId: new mongoose.Types.ObjectId().toString(),
      });
    expect(resInvalid.status).toBe(401);
    expect(resInvalid.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });

  test("requiere autenticación para aceptar o rechazar invitaciones", async () => {
    const inviteId = new mongoose.Types.ObjectId().toString();

    const acceptNoToken = await request(app).post(
      `/api/invites/accept/${inviteId}`
    );
    expect(acceptNoToken.status).toBe(401);
    expect(acceptNoToken.body).toHaveProperty("error", "No token provided");

    const acceptInvalid = await request(app)
      .post(`/api/invites/accept/${inviteId}`)
      .set(invalidAuthHeader());
    expect(acceptInvalid.status).toBe(401);
    expect(acceptInvalid.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );

    const rejectInvalid = await request(app)
      .post(`/api/invites/reject/${inviteId}`)
      .set(invalidAuthHeader());
    expect(rejectInvalid.status).toBe(401);
    expect(rejectInvalid.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });

  test("requiere autenticación para listar invitaciones pendientes", async () => {
    const resNoToken = await request(app).get("/api/invites/pending");
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body).toHaveProperty("error", "No token provided");

    const resInvalid = await request(app)
      .get("/api/invites/pending")
      .set(invalidAuthHeader());
    expect(resInvalid.status).toBe(401);
    expect(resInvalid.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });
});
