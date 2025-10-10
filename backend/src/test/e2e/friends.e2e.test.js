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

const sendFriendRequest = ({ token, to }) =>
  request(app)
    .post("/api/friends/send")
    .set(authHeader(token))
    .send({ to });

const respondFriendRequest = ({ token, id, status }) =>
  request(app)
    .post(`/api/friends/respond/${id}`)
    .set(authHeader(token))
    .send({ status });

describe("/api/friends E2E", () => {
  test("permite enviar y aceptar una solicitud de amistad", async () => {
    const { token: senderToken, user: sender } = await registerUser({
      username: "alice",
      email: "alice@mail.com",
    });
    const { token: receiverToken, user: receiver } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    const sendRes = await sendFriendRequest({
      token: senderToken,
      to: receiver._id,
    });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body).toHaveProperty("status", "pending");

    const pendingRes = await request(app)
      .get("/api/friends/pending")
      .set(authHeader(receiverToken));

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0]).toMatchObject({
      type: "friend",
      status: "pending",
    });

    const respondRes = await respondFriendRequest({
      token: receiverToken,
      id: sendRes.body._id,
      status: "accepted",
    });

    expect(respondRes.status).toBe(200);
    expect(respondRes.body).toHaveProperty("message", "Solicitud accepted");

    const friendsRes = await request(app)
      .get("/api/friends/list")
      .set(authHeader(senderToken));

    expect(friendsRes.status).toBe(200);
    expect(friendsRes.body).toHaveLength(1);
    expect(friendsRes.body[0]).toMatchObject({
      username: "bob",
      email: "bob@mail.com",
    });
  });

  test("rechaza enviar solicitudes sin destinatario válido", async () => {
    const { token } = await registerUser({
      username: "alice",
      email: "alice@mail.com",
    });

    const res = await sendFriendRequest({ token, to: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "error",
      "Falta el usuario destinatario (to)"
    );
  });

  test("evita enviar solicitudes duplicadas", async () => {
    const { token: senderToken } = await registerUser({
      username: "alice",
      email: "alice@mail.com",
    });
    const { user: receiver } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    await sendFriendRequest({
      token: senderToken,
      to: receiver._id,
    });

    const duplicate = await sendFriendRequest({
      token: senderToken,
      to: receiver._id,
    });

    expect(duplicate.status).toBe(400);
    expect(duplicate.body).toHaveProperty(
      "error",
      "Ya enviaste una solicitud a este usuario"
    );
  });

  test("listar pendientes retorna vacío cuando no hay solicitudes", async () => {
    const { token } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    const res = await request(app)
      .get("/api/friends/pending")
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("listar amigos retorna vacío cuando no hay amistades", async () => {
    const { token } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    const res = await request(app)
      .get("/api/friends/list")
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("no permite responder solicitudes inexistentes", async () => {
    const { token } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    const res = await respondFriendRequest({
      token,
      id: new mongoose.Types.ObjectId().toString(),
      status: "accepted",
    });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Solicitud no encontrada");
  });

  test("requiere autenticación para enviar solicitudes", async () => {
    const receiverId = new mongoose.Types.ObjectId().toString();

    const noTokenRes = await request(app)
      .post("/api/friends/send")
      .send({ to: receiverId });
    expect(noTokenRes.status).toBe(401);
    expect(noTokenRes.body).toHaveProperty("error", "No token provided");

    const invalidRes = await request(app)
      .post("/api/friends/send")
      .set(invalidAuthHeader())
      .send({ to: receiverId });
    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });

  test("requiere autenticación para listar pendientes y amigos", async () => {
    const pendingRes = await request(app).get("/api/friends/pending");
    expect(pendingRes.status).toBe(401);
    expect(pendingRes.body).toHaveProperty("error", "No token provided");

    const pendingInvalid = await request(app)
      .get("/api/friends/pending")
      .set(invalidAuthHeader());
    expect(pendingInvalid.status).toBe(401);
    expect(pendingInvalid.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );

    const listRes = await request(app).get("/api/friends/list");
    expect(listRes.status).toBe(401);
    expect(listRes.body).toHaveProperty("error", "No token provided");

    const listInvalid = await request(app)
      .get("/api/friends/list")
      .set(invalidAuthHeader());
    expect(listInvalid.status).toBe(401);
    expect(listInvalid.body).toHaveProperty(
      "error",
      "Token inválido o expirado"
    );
  });
});
