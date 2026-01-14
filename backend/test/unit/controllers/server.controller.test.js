import { jest } from "@jest/globals";
import { HttpError, createHttpError, validationError } from "../../../src/utils/httpError.js";

// Create mock service
const mockServerService = {
  createServer: jest.fn(),
  joinServer: jest.fn(),
  listServersForMember: jest.fn(),
  deleteServer: jest.fn(),
  removeMember: jest.fn(),
  leaveServer: jest.fn(),
};

// Mock the service module
jest.unstable_mockModule("../../../src/services/server/server.service.js", () => ({
  __esModule: true,
  createServerService: jest.fn(() => mockServerService),
  defaultServerService: mockServerService,
}));

const { createServerController } = await import(
  "../../../src/services/server/server.controller.js"
);

const createServerDoc = (overrides = {}) => {
  const doc = {
    _id: "server123",
    name: "Test Server",
    description: "Servidor de prueba",
    owner: "user123",
    members: ["user123"],
    channels: [],
    toJSON: jest.fn(() => ({
      id: doc._id,
      name: doc.name,
      description: doc.description,
      owner: doc.owner,
      members: doc.members,
      channels: doc.channels,
    })),
  };

  Object.assign(doc, overrides);
  if (overrides.toJSON) {
    doc.toJSON = overrides.toJSON;
  } else {
    doc.toJSON = jest.fn(() => ({
      id: doc._id,
      name: doc.name,
      description: doc.description,
      owner: doc.owner,
      members: doc.members,
      channels: doc.channels,
    }));
  }

  return doc;
};

const createChannelDoc = (overrides = {}) => {
  const doc = {
    _id: "channel123",
    name: "general",
    type: "text",
    server: "server123",
    toJSON: jest.fn(() => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      server: doc.server,
    })),
  };

  Object.assign(doc, overrides);
  if (overrides.toJSON) {
    doc.toJSON = overrides.toJSON;
  } else {
    doc.toJSON = jest.fn(() => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      server: doc.server,
    }));
  }

  return doc;
};

describe("server.controller", () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = createServerController({
      serverService: mockServerService,
    });
    req = { body: {}, params: {}, user: { _id: "user123" }, authContext: { headers: {} } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("createServer", () => {
    test("retorna 400 si falta el nombre", async () => {
      req.body = { description: "sin nombre" };

      const error = validationError("El nombre es requerido");
      mockServerService.createServer.mockRejectedValue(error);

      await controller.createServer(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.code).toBe("VALIDATION_ERROR");
      expect(receivedError.message).toBe("El nombre es requerido");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea servidor y canal general", async () => {
      req.body = { name: "Test Server", description: "Servidor de prueba" };

      const serverDoc = createServerDoc();
      const channelDoc = createChannelDoc();
      const members = [{ id: "user123", username: "user123" }];

      mockServerService.createServer.mockResolvedValue({
        server: serverDoc,
        defaultChannel: channelDoc,
        members,
      });

      await controller.createServer(req, res, next);

      expect(mockServerService.createServer).toHaveBeenCalledWith({
        name: "Test Server",
        description: "Servidor de prueba",
        ownerId: "user123",
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Servidor creado",
        data: {
          server: expect.objectContaining({
            id: "server123",
            name: "Test Server",
            description: "Servidor de prueba",
            owner: "user123",
            members: expect.arrayContaining([expect.objectContaining({ id: "user123" })]),
            channels: expect.arrayContaining([]),
          }),
          defaultChannel: expect.objectContaining({
            id: "channel123",
            name: "general",
            type: "text",
            server: "server123",
          }),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("maneja errores internos con status 500", async () => {
      req.body = { name: "Test Server" };
      const error = new Error("DB error");
      mockServerService.createServer.mockRejectedValue(error);

      await controller.createServer(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("joinServer", () => {
    test("retorna 404 si el servidor no existe", async () => {
      req.body = { serverId: "server999", userId: "user456" };

      const error = createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
      mockServerService.joinServer.mockRejectedValue(error);

      await controller.joinServer(req, res, next);

      expect(mockServerService.joinServer).toHaveBeenCalledWith({
        serverId: "server999",
        userId: "user456",
        authContext: req.authContext,
      });
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("SERVER_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("agrega al usuario si no es miembro", async () => {
      req.body = { serverId: "server123", userId: "user456" };

      const serverDoc = createServerDoc({
        members: ["user123", "user456"],
      });
      const members = [
        { id: "user123", username: "user123" },
        { id: "user456", username: "user456" },
      ];

      mockServerService.joinServer.mockResolvedValue({
        server: serverDoc,
        members,
      });

      await controller.joinServer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Usuario unido al servidor",
        data: {
          server: expect.objectContaining({
            id: "server123",
            members: expect.arrayContaining([
              expect.objectContaining({ id: "user123" }),
              expect.objectContaining({ id: "user456" }),
            ]),
          }),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("no duplica miembros existentes", async () => {
      req.body = { serverId: "server123", userId: "user123" };

      const serverDoc = createServerDoc({ members: ["user123"] });
      const members = [{ id: "user123", username: "user123" }];

      mockServerService.joinServer.mockResolvedValue({
        server: serverDoc,
        members,
      });

      await controller.joinServer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Usuario unido al servidor",
        data: {
          server: expect.objectContaining({
            id: "server123",
            members: expect.arrayContaining([expect.objectContaining({ id: "user123" })]),
          }),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("maneja errores inesperados con 500", async () => {
      req.body = { serverId: "server123", userId: "user456" };
      const error = new Error("lookup failed");
      mockServerService.joinServer.mockRejectedValue(error);

      await controller.joinServer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getServers", () => {
    test("retorna servidores del usuario", async () => {
      req.user = { _id: "user123" };

      const serverDoc = createServerDoc({
        channels: [
          {
            _id: "channel123",
            name: "general",
            type: "text",
            server: "server123",
            toJSON: () => ({
              id: "channel123",
              name: "general",
              type: "text",
              server: "server123",
            }),
          },
        ],
      });
      const members = [
        { id: "user123", username: "Tester", email: "test@example.com" },
      ];

      mockServerService.listServersForMember.mockResolvedValue([
        { server: serverDoc, members },
      ]);

      await controller.getServers(req, res, next);

      expect(mockServerService.listServersForMember).toHaveBeenCalledWith({
        userId: "user123",
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          servers: [
            expect.objectContaining({
              id: "server123",
              members: expect.arrayContaining([
                expect.objectContaining({
                  id: "user123",
                  username: "Tester",
                  email: "test@example.com",
                }),
              ]),
            }),
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 ante errores", async () => {
      const error = new Error("query failed");
      mockServerService.listServersForMember.mockRejectedValue(error);

      await controller.getServers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteServer", () => {
    test("retorna 400 si falta serverId", async () => {
      req.params = {};

      const error = validationError("Se requiere el serverId");
      mockServerService.deleteServer.mockRejectedValue(error);

      await controller.deleteServer(req, res, next);

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.code).toBe("VALIDATION_ERROR");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("elimina servidor y canales asociados", async () => {
      req.params = { serverId: "server123" };

      mockServerService.deleteServer.mockResolvedValue(undefined);

      await controller.deleteServer(req, res, next);

      expect(mockServerService.deleteServer).toHaveBeenCalledWith({
        serverId: "server123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Servidor eliminado con éxito",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("devuelve 500 cuando ocurre un error", async () => {
      req.params = { serverId: "server123" };
      const error = new Error("delete failed");
      mockServerService.deleteServer.mockRejectedValue(error);

      await controller.deleteServer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("removeMember", () => {
    test("retorna 404 cuando no encuentra el servidor", async () => {
      req.params = { serverId: "server123", memberId: "user456" };

      const error = createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
      mockServerService.removeMember.mockRejectedValue(error);

      await controller.removeMember(req, res, next);

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("SERVER_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 403 si el usuario no es el dueño", async () => {
      req.params = { serverId: "server123", memberId: "user456" };

      const error = createHttpError(403, "Solo el dueño puede eliminar miembros", { code: "FORBIDDEN" });
      mockServerService.removeMember.mockRejectedValue(error);

      await controller.removeMember(req, res, next);

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(403);
      expect(receivedError.code).toBe("FORBIDDEN");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 400 si el miembro no pertenece al servidor", async () => {
      req.params = { serverId: "server123", memberId: "user999" };

      const error = validationError("El miembro no pertenece al servidor");
      mockServerService.removeMember.mockRejectedValue(error);

      await controller.removeMember(req, res, next);

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.code).toBe("VALIDATION_ERROR");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("elimina miembro y devuelve servidor actualizado", async () => {
      req.params = { serverId: "server123", memberId: "user456" };

      const serverDoc = createServerDoc({ members: ["user123"] });
      const members = [{ id: "user123", username: "user123" }];

      mockServerService.removeMember.mockResolvedValue({
        server: serverDoc,
        members,
      });

      await controller.removeMember(req, res, next);

      expect(mockServerService.removeMember).toHaveBeenCalledWith({
        serverId: "server123",
        memberId: "user456",
        requesterId: "user123",
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Miembro eliminado",
        data: {
          server: expect.objectContaining({
            id: "server123",
            members: expect.arrayContaining([expect.objectContaining({ id: "user123" })]),
          }),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      const error = new Error("lookup failed");
      mockServerService.removeMember.mockRejectedValue(error);

      await controller.removeMember(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("leaveServer", () => {
    test("retorna 400 si falta serverId", async () => {
      req.params = {};

      const error = validationError("Se requiere el serverId");
      mockServerService.leaveServer.mockRejectedValue(error);

      await controller.leaveServer(req, res, next);

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.code).toBe("VALIDATION_ERROR");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 404 si el servidor no existe", async () => {
      req.params = { serverId: "server123" };

      const error = createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
      mockServerService.leaveServer.mockRejectedValue(error);

      await controller.leaveServer(req, res, next);

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("SERVER_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("remueve al usuario del servidor", async () => {
      req.params = { serverId: "server123" };
      req.user = { _id: "user123" };

      mockServerService.leaveServer.mockResolvedValue(undefined);

      await controller.leaveServer(req, res, next);

      expect(mockServerService.leaveServer).toHaveBeenCalledWith({
        serverId: "server123",
        userId: "user123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Has salido del servidor",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { serverId: "server123" };
      const error = new Error("lookup failed");
      mockServerService.leaveServer.mockRejectedValue(error);

      await controller.leaveServer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
