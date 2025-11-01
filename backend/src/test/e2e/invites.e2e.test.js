import request from "supertest";
import { Types } from "mongoose";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../../../test/helpers/e2eServer.js";

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

    const serverDoc = await createServerForUser(ownerToken);

    const sendRes = await sendInvite({
      token: ownerToken,
      to: invited.id,
      serverId: serverDoc.id,
    });
    const { invite } = expectOk(sendRes, 201);
    expect(invite).toMatchObject({
      from: owner.id,
      to: invited.id,
      server: serverDoc.id,
      status: "pending",
    });

    const pendingRes = await request(app)
      .get("/api/invites/pending")
      .set(authHeader(invitedToken));
    const { invites } = expectOk(pendingRes, 200);
    expect(invites).toHaveLength(1);
    expect(invites[0]).toMatchObject({
      status: "pending",
      server: {
        id: serverDoc.id,
        name: "Servidor Base",
      },
      from: {
        id: owner.id,
      },
    });

    const acceptRes = await request(app)
      .post(`/api/invites/accept/${invite.id}`)
      .set(authHeader(invitedToken));
    const acceptData = expectOk(acceptRes, 200);
    expect(acceptData.invite.status).toBe("accepted");

    const serversRes = await request(app)
      .get("/api/servers")
      .set(authHeader(invitedToken));

    const { servers } = expectOk(serversRes, 200);
    expect(servers).toHaveLength(1);
    const memberIds = servers[0].members.map((m) => m.id);
    expect(memberIds).toContain(invited.id);
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

    const serverDoc = await createServerForUser(ownerToken);

    const sendRes = await sendInvite({
      token: ownerToken,
      to: invited.id,
      serverId: serverDoc.id,
    });
    const { invite } = expectOk(sendRes, 201);

    const rejectRes = await request(app)
      .post(`/api/invites/reject/${invite.id}`)
      .set(authHeader(invitedToken));
    const rejectData = expectOk(rejectRes, 200);
    expect(rejectData.invite.status).toBe("rejected");

    const serversRes = await request(app)
      .get("/api/servers")
      .set(authHeader(invitedToken));
    const { servers } = expectOk(serversRes, 200);
    expect(servers).toEqual([]);
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

    const serverDoc = await createServerForUser(ownerToken);

    expectOk(
      await sendInvite({
        token: ownerToken,
        to: invited.id,
        serverId: serverDoc.id,
      }),
      201
    );

    const duplicateRes = await sendInvite({
      token: ownerToken,
      to: invited.id,
      serverId: serverDoc.id,
    });
    expectFail(
      duplicateRes,
      409,
      "Ya existe una invitación pendiente a este usuario para este servidor",
      "INVITE_EXISTS"
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

    const serverDoc = await createServerForUser(ownerToken);

    expectOk(
      await sendInvite({
        token: ownerToken,
        to: invited.id,
        serverId: serverDoc.id,
      }),
      201
    );

    expectOk(
      await request(app)
        .delete(`/api/servers/${serverDoc.id}`)
        .set(authHeader(ownerToken)),
      200
    );

    const pendingRes = await request(app)
      .get("/api/invites/pending")
      .set(authHeader(invitedToken));
    const { invites } = expectOk(pendingRes, 200);
    expect(invites).toEqual([]);
  });

  test("responder invitación inexistente devuelve 404", async () => {
    const { token } = await registerUser({
      username: "owner",
      email: "owner@mail.com",
    });

    const res = await request(app)
      .post(`/api/invites/accept/${new Types.ObjectId()}`)
      .set(authHeader(token));

    expectFail(res, 404, "Invitación no encontrada", "INVITE_NOT_FOUND");
  });

  test("requiere autenticación para enviar invitaciones", async () => {
    const payload = {
      to: new Types.ObjectId().toString(),
      serverId: new Types.ObjectId().toString(),
    };

    const resNoToken = await request(app).post("/api/invites/send").send(payload);
    expectFail(resNoToken, 401, "No token provided", "AUTH_REQUIRED");

    const resInvalid = await request(app)
      .post("/api/invites/send")
      .set(invalidAuthHeader())
      .send(payload);
    expectFail(resInvalid, 401, "Token inválido o expirado", "INVALID_TOKEN");
  });

  test("requiere autenticación para aceptar o rechazar invitaciones", async () => {
    const inviteId = new Types.ObjectId().toString();

    const acceptNoToken = await request(app).post(`/api/invites/accept/${inviteId}`);
    expectFail(acceptNoToken, 401, "No token provided", "AUTH_REQUIRED");

    const acceptInvalid = await request(app)
      .post(`/api/invites/accept/${inviteId}`)
      .set(invalidAuthHeader());
    expectFail(acceptInvalid, 401, "Token inválido o expirado", "INVALID_TOKEN");

    const rejectInvalid = await request(app)
      .post(`/api/invites/reject/${inviteId}`)
      .set(invalidAuthHeader());
    expectFail(rejectInvalid, 401, "Token inválido o expirado", "INVALID_TOKEN");
  });

  test("requiere autenticación para listar invitaciones pendientes", async () => {
    const resNoToken = await request(app).get("/api/invites/pending");
    expectFail(resNoToken, 401, "No token provided", "AUTH_REQUIRED");

    const resInvalid = await request(app)
      .get("/api/invites/pending")
      .set(invalidAuthHeader());
    expectFail(resInvalid, 401, "Token inválido o expirado", "INVALID_TOKEN");
  });
});
