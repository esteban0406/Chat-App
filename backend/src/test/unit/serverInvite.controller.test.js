import { jest } from "@jest/globals";

// -------------------------
// 1. Crear mocks de los modelos
// -------------------------
const ServerInviteMock = jest.fn(); // constructor (para new ServerInvite())
ServerInviteMock.findOne = jest.fn();
ServerInviteMock.findById = jest.fn();
ServerInviteMock.find = jest.fn();

const ServerMock = { findByIdAndUpdate: jest.fn() };

jest.unstable_mockModule("../../models/serverInvite.js", () => ({
  __esModule: true,
  default: ServerInviteMock,
}));

jest.unstable_mockModule("../../models/Server.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

// -------------------------
// 2. Importar después de mockear
// -------------------------
const { default: ServerInvite } = await import("../../models/serverInvite.js");
const { default: Server } = await import("../../models/Server.js");
const {
  sendServerInvite,
  respondServerInvite,
  getPendingServerInvites,
} = await import("../../controllers/serverInvite.controller.js");

describe("serverInvite.controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: "user123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // -------------------------------
  // sendServerInvite
  // -------------------------------
  test("sendServerInvite debe retornar 400 si ya existe una invitación pendiente", async () => {
    req.body = { to: "user456", serverId: "server123" };
    ServerInvite.findOne.mockResolvedValue({ _id: "invite123" });

    await sendServerInvite(req, res);

    expect(ServerInvite.findOne).toHaveBeenCalledWith({
      from: "user123",
      to: "user456",
      server: "server123",
      status: "pending",
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Ya existe una invitación pendiente a este usuario para este servidor",
    });
  });

  test("sendServerInvite debe crear una invitación nueva", async () => {
    req.body = { to: "user456", serverId: "server123" };
    ServerInvite.findOne.mockResolvedValue(null);

    const mockInvite = { save: jest.fn().mockResolvedValue(true), _id: "newInvite" };
    ServerInvite.mockImplementation(() => mockInvite);

    await sendServerInvite(req, res);

    expect(mockInvite.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockInvite);
  });

  test("sendServerInvite debe manejar error de duplicado (code 11000)", async () => {
    req.body = { to: "user456", serverId: "server123" };
    ServerInvite.findOne.mockRejectedValue({ code: 11000 });

    await sendServerInvite(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invitación duplicada no permitida",
    });
  });

  test("respondServerInvite debe retornar 404 si no encuentra la invitación", async () => {
    req.params = { inviteId: "invite123" };
    req.body = { status: "accepted" };
    ServerInvite.findById.mockResolvedValue(null);

    await respondServerInvite(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Invitación no encontrada" });
  });

  test("respondServerInvite debe aceptar invitación y agregar miembro al server", async () => {
    req.params = { inviteId: "invite123" };
    req.body = { status: "accepted" };

    const mockInvite = {
      _id: "invite123",
      server: "server123",
      to: "user456",
      status: "pending",
      save: jest.fn().mockResolvedValue(true),
    };
    ServerInvite.findById.mockResolvedValue(mockInvite);

    await respondServerInvite(req, res);

    expect(mockInvite.save).toHaveBeenCalled();
    expect(Server.findByIdAndUpdate).toHaveBeenCalledWith("server123", {
      $addToSet: { members: "user456" },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, invite: mockInvite });
  });

  test("respondServerInvite debe rechazar invitación sin modificar server", async () => {
    req.params = { inviteId: "invite123" };
    req.body = { status: "rejected" };

    const mockInvite = {
      _id: "invite123",
      server: "server123",
      to: "user456",
      status: "pending",
      save: jest.fn().mockResolvedValue(true),
    };
    ServerInvite.findById.mockResolvedValue(mockInvite);

    await respondServerInvite(req, res);

    expect(Server.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, invite: mockInvite });
  });

  test("getPendingServerInvites debe retornar solo invitaciones con server válido", async () => {
    const invites = [
      { _id: "invite1", server: { _id: "server123", name: "Server" } },
      { _id: "invite2", server: null }, // inválido
    ];

    ServerInvite.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: (cb) => cb(invites),
    });

    await getPendingServerInvites(req, res);

    expect(res.json).toHaveBeenCalledWith([invites[0]]);
  });
});
