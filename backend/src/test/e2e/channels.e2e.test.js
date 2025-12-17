import request from "supertest";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../../../test/helpers/e2eServer.js";
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

const expectOk = (response, status) => {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(true);
  return response.body.data;
};

const expectFail = (response, status, message, code) => {
  expect(response.status).toBe(status);
  expect(response.body).toMatchObject({
    success: false,
    message,
    code,
  });
};

const AUTH_ERROR = {
  message: "Token invalido o expirado",
  code: "INVALID_TOKEN",
};

const registerUser = ({ username, email }) =>
  createBetterAuthTestUser({ username, email });

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
      name: body.name ?? "Servidor Base",
      description: body.description ?? "desc",
    });

  const data = expectOk(res, 201);
  return data.server;
};

const createChannel = (token, payload) =>
  request(app).post("/api/channels").set(authHeader(token)).send(payload);

describe("/api/channels E2E", () => {
  test("POST /api/channels crea un canal cuando el usuario es miembro", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(token);

    const res = await createChannel(token, {
      name: "voz",
      type: "voice",
      serverId: serverDoc.id,
    });

    const { channel } = expectOk(res, 201);
    expect(channel).toMatchObject({
      name: "voz",
      type: "voice",
      server: serverDoc.id,
    });

    const listRes = await request(app)
      .get(`/api/channels/${serverDoc.id}`)
      .set(authHeader(token));
    const { channels } = expectOk(listRes, 200);
    const names = channels.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(["voz", "general"]));
  });

  test("POST /api/channels rechaza crear canal si falta nombre o serverId", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });

    const res = await createChannel(token, { name: "" });

    expectFail(res, 400, "El nombre y el serverId son requeridos", "VALIDATION_ERROR");
  });

  test("POST /api/channels rechaza si el usuario no es miembro", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(ownerToken);

    const { token: otherToken } = await registerUser({
      username: "other",
      email: "other@mail.com",
    });

    const res = await createChannel(otherToken, {
      name: "nuevo",
      serverId: serverDoc.id,
    });

    expectFail(res, 403, "No eres miembro de este servidor", "FORBIDDEN");
  });

  test("GET /api/channels/:serverId devuelve canales cuando el usuario pertenece", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(token);

    expectOk(await createChannel(token, { name: "chat", serverId: serverDoc.id }), 201);

    const res = await request(app)
      .get(`/api/channels/${serverDoc.id}`)
      .set(authHeader(token));

    const { channels } = expectOk(res, 200);
    expect(channels).toHaveLength(2);
    expect(channels.map((c) => c.name)).toEqual(expect.arrayContaining(["general", "chat"]));
  });

  test("GET /api/channels/:serverId devuelve 403 cuando el usuario no pertenece", async () => {
    const { token: ownerToken } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(ownerToken);

    const { token } = await registerUser({
      username: "other",
      email: "other@mail.com",
    });

    const res = await request(app)
      .get(`/api/channels/${serverDoc.id}`)
      .set(authHeader(token));

    expectFail(res, 403, "No eres miembro de este servidor", "FORBIDDEN");
  });

  test("DELETE /api/channels/:channelId elimina el canal", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(token);

    const channelRes = await createChannel(token, {
      name: "temporal",
      serverId: serverDoc.id,
    });
    const { channel } = expectOk(channelRes, 201);

    const deleteRes = await request(app)
      .delete(`/api/channels/${channel.id}`)
      .set(authHeader(token));

    const deleteData = expectOk(deleteRes, 200);
    expect(deleteData).toMatchObject({ channelId: channel.id });

    const listRes = await request(app)
      .get(`/api/channels/${serverDoc.id}`)
      .set(authHeader(token));
    const { channels } = expectOk(listRes, 200);
    expect(channels.map((c) => c.name)).not.toContain("temporal");
  });

  test("POST /api/channels requiere autenticación", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(token);

    const payload = { name: "seguro", serverId: serverDoc.id };

    const noTokenRes = await request(app).post("/api/channels").send(payload);
    expectFail(noTokenRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const invalidTokenRes = await request(app)
      .post("/api/channels")
      .set(invalidAuthHeader())
      .send(payload);
    expectFail(invalidTokenRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);
  });

  test("GET /api/channels/:serverId requiere autenticación", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(token);

    const noTokenRes = await request(app).get(`/api/channels/${serverDoc.id}`);
    expectFail(noTokenRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const invalidRes = await request(app)
      .get(`/api/channels/${serverDoc.id}`)
      .set(invalidAuthHeader());
    expectFail(invalidRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);
  });

  test("DELETE /api/channels/:channelId requiere autenticación", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });
    const serverDoc = await createServerForUser(token);
    const channelRes = await createChannel(token, {
      name: "secure-delete",
      serverId: serverDoc.id,
    });
    const { channel } = expectOk(channelRes, 201);

    const noTokenRes = await request(app).delete(`/api/channels/${channel.id}`);
    expectFail(noTokenRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const invalidTokenRes = await request(app)
      .delete(`/api/channels/${channel.id}`)
      .set(invalidAuthHeader());
    expectFail(invalidTokenRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);
  });
});
