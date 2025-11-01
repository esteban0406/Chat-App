import request from "supertest";
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

const expectFail = (res, status, message, code) => {
  expect(res.status).toBe(status);
  expect(res.body).toMatchObject({
    success: false,
    message,
    code,
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

const registerUser = async ({ username, email }) => {
  const res = await request(app).post("/api/auth/register").send({
    username,
    email,
    password: "123456",
  });
  const data = expectOk(res, 201);
  return { token: data.token, user: data.user };
};

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

const createServerForUser = async (token, body = {}) => {
  const res = await request(app)
    .post("/api/servers")
    .set(authHeader(token))
    .send({
      name: body.name ?? "Servidor Base",
      description: body.description ?? "desc",
    });
  return expectOk(res, 201);
};

const sendMessage = (payload) => request(app).post("/api/messages").send(payload);

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

    const serverData = await createServerForUser(memberToken);
    const serverId = serverData.server.id;
    const channel = serverData.defaultChannel;

    const joinRes = await request(app).post("/api/servers/join").send({
      serverId,
      userId: owner.id,
    });
    expectOk(joinRes, 200);

    const res = await sendMessage({
      text: "Hola mundo",
      senderId: owner.id,
      channelId: channel.id,
    });
    const { message } = expectOk(res, 201);
    expect(message).toMatchObject({
      text: "Hola mundo",
      channel: channel.id,
      sender: expect.objectContaining({ id: owner.id }),
    });

    const list = await request(app).get(`/api/messages/${channel.id}`);
    const { messages } = expectOk(list, 200);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      text: "Hola mundo",
      channel: channel.id,
      sender: expect.objectContaining({ id: owner.id, username: owner.username }),
    });
  });

  test("POST /api/messages valida campos obligatorios", async () => {
    const res = await sendMessage({
      text: "",
      senderId: "",
      channelId: "",
    });

    expectFail(res, 400, "Faltan campos obligatorios", "VALIDATION_ERROR");
  });

  test("GET /api/messages/:channelId retorna lista vacía cuando no hay mensajes", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverData = await createServerForUser(token);
    const channelId = serverData.defaultChannel.id;

    const res = await request(app).get(`/api/messages/${channelId}`);
    const { messages } = expectOk(res, 200);
    expect(messages).toEqual([]);
  });
});
