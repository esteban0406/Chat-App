import { jest } from "@jest/globals";
import { HttpError, createHttpError } from "../../../src/utils/httpError.js";

// Create mock service
const mockServerInviteService = {
  sendInvite: jest.fn(),
  acceptInvite: jest.fn(),
  rejectInvite: jest.fn(),
  listPendingInvites: jest.fn(),
};

// Mock the service module
jest.unstable_mockModule("../../../src/services/server/invite/serverInvite.service.js", () => ({
  __esModule: true,
  createServerInviteService: jest.fn(() => mockServerInviteService),
  defaultServerInviteService: mockServerInviteService,
}));

const { createServerInviteController } = await import(
  "../../../src/services/server/invite/serverInvite.controller.js"
);

const createInviteDoc = (overrides = {}) => {
  const doc = {
    _id: "invite123",
    from: "user123",
    to: "user456",
    server: "server123",
    status: "pending",
    toJSON: jest.fn(() => ({
      id: doc._id,
      from: doc.from,
      to: doc.to,
      server: doc.server,
      status: doc.status,
    })),
  };

  Object.assign(doc, overrides);
  if (overrides.toJSON) {
    doc.toJSON = overrides.toJSON;
  } else {
    doc.toJSON = jest.fn(() => ({
      id: doc._id,
      from: doc.from,
      to: doc.to,
      server: doc.server,
      status: doc.status,
    }));
  }

  return doc;
};

describe("serverInvite.controller", () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = createServerInviteController({
      serverInviteService: mockServerInviteService,
    });
    req = { body: {}, params: {}, user: { _id: "user123" }, authContext: { headers: {} } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("sendServerInvite", () => {
    test("retorna 409 cuando ya existe una invitación pendiente", async () => {
      req.body = { to: "user456", serverId: "server123" };

      const error = createHttpError(
        409,
        "Ya existe una invitación pendiente a este usuario para este servidor",
        { code: "INVITE_EXISTS" }
      );
      mockServerInviteService.sendInvite.mockRejectedValue(error);

      await controller.sendInvite(req, res, next);

      expect(mockServerInviteService.sendInvite).toHaveBeenCalledWith({
        fromUserId: "user123",
        toUserId: "user456",
        serverId: "server123",
      });
      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(409);
      expect(receivedError.code).toBe("INVITE_EXISTS");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea una invitación nueva y responde con 201", async () => {
      req.body = { to: "user456", serverId: "server123" };

      const inviteDoc = createInviteDoc();
      mockServerInviteService.sendInvite.mockResolvedValue(inviteDoc);

      await controller.sendInvite(req, res, next);

      expect(mockServerInviteService.sendInvite).toHaveBeenCalledWith({
        fromUserId: "user123",
        toUserId: "user456",
        serverId: "server123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invitación enviada",
        data: {
          invite: {
            id: "invite123",
            from: "user123",
            to: "user456",
            server: "server123",
            status: "pending",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 409 cuando el guardado falla por clave duplicada", async () => {
      req.body = { to: "user456", serverId: "server123" };

      const error = createHttpError(409, "Invitación duplicada no permitida", { code: "INVITE_EXISTS" });
      mockServerInviteService.sendInvite.mockRejectedValue(error);

      await controller.sendInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(409);
      expect(receivedError.code).toBe("INVITE_EXISTS");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve 500 ante un error inesperado", async () => {
      req.body = { to: "user456", serverId: "server123" };

      const unexpectedError = new Error("DB down");
      mockServerInviteService.sendInvite.mockRejectedValue(unexpectedError);

      await controller.sendInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("acceptServerInvite", () => {
    test("retorna 404 cuando la invitación no existe", async () => {
      req.params = { inviteId: "invite123" };

      const error = createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
      mockServerInviteService.acceptInvite.mockRejectedValue(error);

      await controller.acceptInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("INVITE_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("acepta la invitación y agrega al miembro", async () => {
      req.params = { inviteId: "invite123" };

      const inviteDoc = createInviteDoc({ status: "accepted" });
      mockServerInviteService.acceptInvite.mockResolvedValue(inviteDoc);

      await controller.acceptInvite(req, res, next);

      expect(mockServerInviteService.acceptInvite).toHaveBeenCalledWith({
        inviteId: "invite123",
        userId: "user123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invitación aceptada",
        data: {
          invite: {
            id: "invite123",
            from: "user123",
            to: "user456",
            server: "server123",
            status: "accepted",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error al recuperar la invitación", async () => {
      req.params = { inviteId: "invite123" };

      const unexpectedError = new Error("lookup failed");
      mockServerInviteService.acceptInvite.mockRejectedValue(unexpectedError);

      await controller.acceptInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("rejectServerInvite", () => {
    test("retorna 404 cuando la invitación no existe", async () => {
      req.params = { inviteId: "invite123" };

      const error = createHttpError(404, "Invitación no encontrada", { code: "INVITE_NOT_FOUND" });
      mockServerInviteService.rejectInvite.mockRejectedValue(error);

      await controller.rejectInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("INVITE_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("rechaza la invitación sin tocar el servidor", async () => {
      req.params = { inviteId: "invite123" };

      const inviteDoc = createInviteDoc({ status: "rejected" });
      mockServerInviteService.rejectInvite.mockResolvedValue(inviteDoc);

      await controller.rejectInvite(req, res, next);

      expect(mockServerInviteService.rejectInvite).toHaveBeenCalledWith({
        inviteId: "invite123",
        userId: "user123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invitación rechazada",
        data: {
          invite: {
            id: "invite123",
            from: "user123",
            to: "user456",
            server: "server123",
            status: "rejected",
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error al recuperar la invitación", async () => {
      req.params = { inviteId: "invite123" };

      const unexpectedError = new Error("lookup failed");
      mockServerInviteService.rejectInvite.mockRejectedValue(unexpectedError);

      await controller.rejectInvite(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getPendingServerInvites", () => {
    test("retorna solo invitaciones con servidor válido", async () => {
      const inviteDoc = createInviteDoc({
        _id: "invite1",
        from: "user123",
        to: "user456",
        server: "server123",
      });
      const fromUser = {
        id: "user123",
        username: "Alice",
        email: "alice@example.com",
      };
      const server = {
        id: "server123",
        name: "Server",
      };

      mockServerInviteService.listPendingInvites.mockResolvedValue([
        { invite: inviteDoc, fromUser, server },
      ]);

      await controller.getPendingInvites(req, res, next);

      expect(mockServerInviteService.listPendingInvites).toHaveBeenCalledWith({
        userId: "user123",
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          invites: [
            {
              id: "invite1",
              from: {
                id: "user123",
                username: "Alice",
                email: "alice@example.com",
              },
              to: "user456",
              server: {
                id: "server123",
                name: "Server",
              },
              status: "pending",
              type: "server",
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error al buscar", async () => {
      const unexpectedError = new Error("query failed");
      mockServerInviteService.listPendingInvites.mockRejectedValue(unexpectedError);

      await controller.getPendingInvites(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(unexpectedError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
