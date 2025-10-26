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

const createServerForUser = async (token, body = {}) =>
  request(app)
    .post("/api/servers")
    .set(authHeader(token))
    .send({
      name: body.name ?? "Servidor Base",
      description: body.description ?? "desc",
    });

const createChannel = async (token, serverId, channel = {}) => {
  const res = await request(app)
    .post("/api/channels")
    .set(authHeader(token))
    .send({
      name: channel.name ?? "chat",
      type: channel.type ?? "text",
      serverId,
    });
  return res.body;
};

const sendMessage = (payload) =>
  request(app).post("/api/messages").send(payload);

describe("/api/messages E2E", () => {
  test("POST /api/messages crea un mensaje y lo asocia al canal", async () => {
    const { user: owner } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const { token: memberToken, user: member } = await registerUser({
      username: "member",
      email: "member@mail.com",
    });

    const serverRes = await createServerForUser(memberToken);
    const serverId = serverRes.body._id;
    const channel = serverRes.body.defaultChannel;

    await request(app).post("/api/servers/join").send({
      serverId,
      userId: owner.id,
    });

    const res = await sendMessage({
      text: "Hola mundo",
      senderId: owner.id,
      channelId: channel._id,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      text: "Hola mundo",
      channel: channel._id,
    });
    expect(res.body).toHaveProperty("sender");

    const list = await request(app).get(`/api/messages/${channel._id}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({
      text: "Hola mundo",
      channel: channel._id,
    });
    expect(list.body[0]).toHaveProperty("sender.username");
  });

  test("POST /api/messages valida campos obligatorios", async () => {
    const res = await sendMessage({
      text: "",
      senderId: "",
      channelId: "",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Faltan campos obligatorios");
  });

  test("GET /api/messages/:channelId retorna lista vacía cuando no hay mensajes", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverRes = await createServerForUser(token);
    const channelId = serverRes.body.defaultChannel._id;

    const res = await request(app).get(`/api/messages/${channelId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
