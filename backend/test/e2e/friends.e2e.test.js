import request from "supertest";
import { Types } from "mongoose";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../helpers/e2eServer.js";
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

const sendFriendRequest = ({ token, to }) =>
  request(app).post("/api/friends/send").set(authHeader(token)).send({ to });

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
      to: receiver.id,
    });
    const { request: friendRequest } = expectOk(sendRes, 201);
    expect(friendRequest).toMatchObject({
      from: sender.id,
      to: receiver.id,
      status: "pending",
    });

    const pendingRes = await request(app)
      .get("/api/friends/pending")
      .set(authHeader(receiverToken));
    const { requests } = expectOk(pendingRes, 200);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      type: "friend",
      status: "pending",
      from: expect.objectContaining({ id: sender.id }),
    });

    const respondRes = await respondFriendRequest({
      token: receiverToken,
      id: friendRequest.id,
      status: "accepted",
    });
    const { request: acceptedRequest } = expectOk(respondRes, 200);
    expect(acceptedRequest.status).toBe("accepted");

    const friendsRes = await request(app)
      .get("/api/friends/list")
      .set(authHeader(senderToken));
    const { friends } = expectOk(friendsRes, 200);
    expect(friends).toHaveLength(1);
    expect(friends[0]).toMatchObject({
      id: receiver.id,
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
    expectFail(res, 400, "Falta el usuario destinatario (to)", "VALIDATION_ERROR");
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

    expectOk(
      await sendFriendRequest({
        token: senderToken,
        to: receiver.id,
      }),
      201
    );

    const duplicate = await sendFriendRequest({
      token: senderToken,
      to: receiver.id,
    });
    expectFail(
      duplicate,
      409,
      "Ya enviaste una solicitud a este usuario",
      "REQUEST_EXISTS"
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
    const { requests } = expectOk(res, 200);
    expect(requests).toEqual([]);
  });

  test("listar amigos retorna vacío cuando no hay amistades", async () => {
    const { token } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    const res = await request(app)
      .get("/api/friends/list")
      .set(authHeader(token));
    const { friends } = expectOk(res, 200);
    expect(friends).toEqual([]);
  });

  test("no permite responder solicitudes inexistentes", async () => {
    const { token } = await registerUser({
      username: "bob",
      email: "bob@mail.com",
    });

    const res = await respondFriendRequest({
      token,
      id: new Types.ObjectId().toString(),
      status: "accepted",
    });
    expectFail(res, 404, "Solicitud no encontrada", "REQUEST_NOT_FOUND");
  });

  test("requiere autenticación para enviar solicitudes", async () => {
    const receiverId = new Types.ObjectId().toString();

    const noTokenRes = await request(app).post("/api/friends/send").send({ to: receiverId });
    expectFail(noTokenRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const invalidRes = await request(app)
      .post("/api/friends/send")
      .set(invalidAuthHeader())
      .send({ to: receiverId });
    expectFail(invalidRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);
  });

  test("requiere autenticación para listar pendientes y amigos", async () => {
    const pendingRes = await request(app).get("/api/friends/pending");
    expectFail(pendingRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const pendingInvalid = await request(app)
      .get("/api/friends/pending")
      .set(invalidAuthHeader());
    expectFail(pendingInvalid, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const listRes = await request(app).get("/api/friends/list");
    expectFail(listRes, 401, AUTH_ERROR.message, AUTH_ERROR.code);

    const listInvalid = await request(app)
      .get("/api/friends/list")
      .set(invalidAuthHeader());
    expectFail(listInvalid, 401, AUTH_ERROR.message, AUTH_ERROR.code);
  });
});
