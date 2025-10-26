import { jest } from "@jest/globals";

const ServerInviteMock = jest.fn();
ServerInviteMock.findOne = jest.fn();
ServerInviteMock.findById = jest.fn();
ServerInviteMock.find = jest.fn();

const ServerMock = { findByIdAndUpdate: jest.fn() };

jest.unstable_mockModule("../../../models/serverInvite.js", () => ({
  __esModule: true,
  default: ServerInviteMock,
}));

jest.unstable_mockModule("../../../models/Server.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

const { default: ServerInvite } = await import("../../../models/serverInvite.js");
const { default: Server } = await import("../../../models/Server.js");
const {
  sendServerInvite,
  acceptServerInvite,
  rejectServerInvite,
  getPendingServerInvites,
} = await import("../../../controllers/serverInvite.controller.js");

const createPopulateQuery = (result) => {
  const query = {
    populate: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  query.populate.mockImplementation(() => query);
  query.then = (resolve, reject) => query.exec().then(resolve, reject);
  return query;
};

describe("serverInvite.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: "user123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
    ServerInvite.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(undefined),
    }));
  });

  describe("sendServerInvite", () => {
    test("retorna 400 cuando ya existe una invitación pendiente", async () => {
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

    test("crea una invitación nueva y responde con 201", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInvite.findOne.mockResolvedValue(null);

      const mockInvite = { save: jest.fn().mockResolvedValue(true), _id: "newInvite" };
      ServerInvite.mockImplementation(() => mockInvite);

      await sendServerInvite(req, res);

      expect(ServerInvite).toHaveBeenCalledWith({
        from: "user123",
        to: "user456",
        server: "server123",
      });
      expect(mockInvite.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockInvite);
    });

    test("devuelve 400 cuando el guardado falla por clave duplicada", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInvite.findOne.mockResolvedValue(null);

      const duplicateError = { code: 11000 };
      const mockInvite = { save: jest.fn().mockRejectedValue(duplicateError) };
      ServerInvite.mockImplementation(() => mockInvite);

      await sendServerInvite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invitación duplicada no permitida",
      });
    });

    test("devuelve 500 ante un error inesperado", async () => {
      req.body = { to: "user456", serverId: "server123" };
      ServerInvite.findOne.mockResolvedValue(null);

      const unexpectedError = new Error("DB down");
      const mockInvite = { save: jest.fn().mockRejectedValue(unexpectedError) };
      ServerInvite.mockImplementation(() => mockInvite);

      await sendServerInvite(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: unexpectedError.message });
    });
  });

  describe("acceptServerInvite", () => {
    test("retorna 404 cuando la invitación no existe", async () => {
      req.params = { inviteId: "invite123" };
      ServerInvite.findById.mockResolvedValue(null);

      await acceptServerInvite(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Invitación no encontrada" });
    });

    test("acepta la invitación y agrega al miembro", async () => {
      req.params = { inviteId: "invite123" };

      const mockInvite = {
        _id: "invite123",
        server: "server123",
        to: "user456",
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
      };
      ServerInvite.findById.mockResolvedValue(mockInvite);

      await acceptServerInvite(req, res);

      expect(mockInvite.status).toBe("accepted");
      expect(mockInvite.save).toHaveBeenCalled();
      expect(Server.findByIdAndUpdate).toHaveBeenCalledWith("server123", {
        $addToSet: { members: "user456" },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, invite: mockInvite });
    });

    test("devuelve 500 cuando ocurre un error al recuperar la invitación", async () => {
      req.params = { inviteId: "invite123" };
      req.body = { status: "accepted" };

      const unexpectedError = new Error("lookup failed");
      ServerInvite.findById.mockRejectedValue(unexpectedError);

      await acceptServerInvite(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: unexpectedError.message });
    });
  });

  describe("rejectServerInvite", () => {
    test("retorna 404 cuando la invitación no existe", async () => {
      req.params = { inviteId: "invite123" };
      ServerInvite.findById.mockResolvedValue(null);

      await rejectServerInvite(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Invitación no encontrada" });
    });

    test("rechaza la invitación sin tocar el servidor", async () => {
      req.params = { inviteId: "invite123" };

      const mockInvite = {
        _id: "invite123",
        server: "server123",
        to: "user456",
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
      };
      ServerInvite.findById.mockResolvedValue(mockInvite);

      await rejectServerInvite(req, res);

      expect(mockInvite.status).toBe("rejected");
      expect(Server.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, invite: mockInvite });
    });

    test("devuelve 500 cuando ocurre un error al recuperar la invitación", async () => {
      req.params = { inviteId: "invite123" };

      const unexpectedError = new Error("lookup failed");
      ServerInvite.findById.mockRejectedValue(unexpectedError);

      await rejectServerInvite(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: unexpectedError.message });
    });
  });

  describe("getPendingServerInvites", () => {
    test("retorna solo invitaciones con servidor válido", async () => {
      const invites = [
        { _id: "invite1", server: { _id: "server123", name: "Server" } },
        { _id: "invite2", server: null },
      ];
      ServerInvite.find.mockReturnValue(createPopulateQuery(invites));

      await getPendingServerInvites(req, res);

      expect(ServerInvite.find).toHaveBeenCalledWith({
        to: "user123",
        status: "pending",
      });
      expect(res.json).toHaveBeenCalledWith([invites[0]]);
    });

    test("devuelve 500 cuando ocurre un error al buscar", async () => {
      const unexpectedError = new Error("query failed");
      ServerInvite.find.mockImplementation(() => {
        throw unexpectedError;
      });

      await getPendingServerInvites(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: unexpectedError.message });
    });
  });
});
