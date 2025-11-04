import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";

const ServerMock = jest.fn();
ServerMock.findById = jest.fn();
ServerMock.find = jest.fn();
ServerMock.findByIdAndDelete = jest.fn();

const ChannelMock = jest.fn();
ChannelMock.deleteMany = jest.fn();

jest.unstable_mockModule("../../../services/server/Server.model.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

jest.unstable_mockModule("../../../services/channel/Channel.model.js", () => ({
  __esModule: true,
  default: ChannelMock,
}));

const {
  createServer,
  joinServer,
  getServers,
  deleteServer,
  removeMember,
  leaveServer,
} = await import("../../../services/server/server.controller.js");

const createServerDoc = (overrides = {}) => {
  const doc = {
    _id: "server123",
    name: "Test Server",
    description: "Servidor de prueba",
    owner: "user123",
    members: ["user123"],
    channels: [],
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn(),
  };

  Object.assign(doc, overrides);

  doc.populate.mockImplementation(() => Promise.resolve(doc));
  doc.toObject =
    overrides.toObject ??
    jest.fn(() => ({
      _id: doc._id,
      name: doc.name,
      description: doc.description,
      owner: doc.owner,
      members: doc.members,
      channels: doc.channels,
    }));

  return doc;
};

const createChannelDoc = (overrides = {}) => {
  const doc = {
    _id: "channel123",
    name: "general",
    type: "text",
    server: "server123",
    save: jest.fn().mockResolvedValue(undefined),
  };

  Object.assign(doc, overrides);

  doc.toObject =
    overrides.toObject ??
    jest.fn(() => ({
      _id: doc._id,
      name: doc.name,
      type: doc.type,
      server: doc.server,
    }));

  return doc;
};

const createFindQuery = (result) => {
  const query = {
    populate: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  query.populate.mockImplementation(() => query);
  query.then = (resolve, reject) => query.exec().then(resolve, reject);
  return query;
};

describe("server.controller", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: "user123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
    ServerMock.mockReset();
    ServerMock.findById.mockReset();
    ServerMock.find.mockReset();
    ServerMock.findByIdAndDelete.mockReset();
    ChannelMock.mockReset();
    ChannelMock.deleteMany.mockReset();
  });

  describe("createServer", () => {
    test("retorna 400 si falta el nombre", async () => {
      req.body = { description: "sin nombre" };

      await createServer(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("El nombre es requerido");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea servidor y canal general", async () => {
      req.body = { name: "Test Server", description: "Servidor de prueba" };
      const serverDoc = createServerDoc({ members: ["user123"], channels: [] });
      ServerMock.mockImplementation(() => serverDoc);
      const channelDoc = createChannelDoc({ server: "server123" });
      ChannelMock.mockImplementation(() => channelDoc);

      await createServer(req, res, next);

      expect(ServerMock).toHaveBeenCalledWith({
        name: "Test Server",
        description: "Servidor de prueba",
        owner: "user123",
        members: ["user123"],
      });
      expect(ChannelMock).toHaveBeenCalledWith({
        name: "general",
        type: "text",
        server: "server123",
      });
      expect(serverDoc.save).toHaveBeenCalledTimes(2);
      expect(channelDoc.save).toHaveBeenCalledTimes(1);
      expect(serverDoc.populate).toHaveBeenCalledWith("members", "username email avatar");
      expect(serverDoc.channels).toContain("channel123");
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
            channels: expect.arrayContaining(["channel123"]),
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
      ServerMock.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
        channels: [],
        populate: jest.fn(),
        toObject: jest.fn(),
      }));

      await createServer(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("joinServer", () => {
    test("retorna 404 si el servidor no existe", async () => {
      req.body = { serverId: "server999", userId: "user456" };
      ServerMock.findById.mockResolvedValue(null);

      await joinServer(req, res, next);

      expect(ServerMock.findById).toHaveBeenCalledWith("server999");
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("SERVER_NOT_FOUND");
      expect(error.message).toBe("Servidor no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("agrega al usuario si no es miembro", async () => {
      req.body = { serverId: "server123", userId: "user456" };
      const serverDoc = createServerDoc({
        members: ["user123"],
        save: jest.fn().mockResolvedValue(undefined),
      });
      ServerMock.findById.mockResolvedValue(serverDoc);

      await joinServer(req, res, next);

      expect(serverDoc.members).toContain("user456");
      expect(serverDoc.save).toHaveBeenCalled();
      expect(serverDoc.populate).toHaveBeenCalledWith("members", "username email avatar");
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
      serverDoc.save = jest.fn().mockResolvedValue(undefined);
      ServerMock.findById.mockResolvedValue(serverDoc);

      await joinServer(req, res, next);

      expect(serverDoc.members).toEqual(["user123"]);
      expect(serverDoc.save).not.toHaveBeenCalled();
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
      ServerMock.findById.mockRejectedValue(error);

      await joinServer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getServers", () => {
    test("retorna servidores del usuario", async () => {
      req.user = { _id: "user123" };
      const servers = [
        createServerDoc({
          _id: "server123",
          members: [{ _id: "user123", username: "Tester", email: "test@example.com" }],
          channels: [
            {
              _id: "channel123",
              name: "general",
              type: "text",
              server: "server123",
              toObject: () => ({
                _id: "channel123",
                name: "general",
                type: "text",
                server: "server123",
              }),
            },
          ],
        }),
      ];
      ServerMock.find.mockReturnValue(createFindQuery(servers));

      await getServers(req, res, next);

      expect(ServerMock.find).toHaveBeenCalledWith({ members: "user123" });
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
              channels: expect.arrayContaining([
                expect.objectContaining({
                  id: "channel123",
                  name: "general",
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
      ServerMock.find.mockImplementation(() => {
        throw error;
      });

      await getServers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteServer", () => {
    test("retorna 400 si falta serverId", async () => {
      req.params = {};

      await deleteServer(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Se requiere el serverId");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("elimina servidor y canales asociados", async () => {
      req.params = { serverId: "server123" };
      ChannelMock.deleteMany.mockResolvedValue(undefined);
      ServerMock.findByIdAndDelete.mockResolvedValue(undefined);

      await deleteServer(req, res, next);

      expect(ChannelMock.deleteMany).toHaveBeenCalledWith({ server: "server123" });
      expect(ServerMock.findByIdAndDelete).toHaveBeenCalledWith("server123");
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
      ChannelMock.deleteMany.mockRejectedValue(error);

      await deleteServer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("removeMember", () => {
    test("retorna 404 cuando no encuentra el servidor", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      ServerMock.findById.mockResolvedValue(null);

      await removeMember(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("SERVER_NOT_FOUND");
      expect(error.message).toBe("Servidor no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 403 si el usuario no es el dueño", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      const serverDoc = createServerDoc({ owner: "otherOwner", members: ["user456"] });
      ServerMock.findById.mockResolvedValue(serverDoc);

      await removeMember(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Solo el dueño puede eliminar miembros");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 400 si el miembro no pertenece al servidor", async () => {
      req.params = { serverId: "server123", memberId: "user999" };
      const serverDoc = createServerDoc({ members: ["user123", "user456"] });
      ServerMock.findById.mockResolvedValue(serverDoc);

      await removeMember(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("El miembro no pertenece al servidor");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("elimina miembro y devuelve servidor actualizado", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      const serverDoc = createServerDoc({
        members: ["user123", "user456"],
        save: jest.fn().mockResolvedValue(undefined),
      });
      ServerMock.findById.mockResolvedValue(serverDoc);

      await removeMember(req, res, next);

      expect(serverDoc.members).toEqual(["user123"]);
      expect(serverDoc.save).toHaveBeenCalled();
      expect(serverDoc.populate).toHaveBeenCalledWith("members", "username email avatar");
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
      ServerMock.findById.mockRejectedValue(error);

      await removeMember(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("leaveServer", () => {
    test("retorna 400 si falta serverId", async () => {
      req.params = {};

      await leaveServer(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Se requiere el serverId");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 404 si el servidor no existe", async () => {
      req.params = { serverId: "server123" };
      ServerMock.findById.mockResolvedValue(null);

      await leaveServer(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("SERVER_NOT_FOUND");
      expect(error.message).toBe("Servidor no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("remueve al usuario del servidor", async () => {
      req.params = { serverId: "server123" };
      req.user = { _id: "user123" };
      const serverDoc = createServerDoc({
        owner: "owner999",
        members: ["user123", "user999"],
        save: jest.fn().mockResolvedValue(undefined),
      });
      ServerMock.findById.mockResolvedValue(serverDoc);

      await leaveServer(req, res, next);

      expect(serverDoc.members).toEqual(["user999"]);
      expect(serverDoc.save).toHaveBeenCalled();
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
      ServerMock.findById.mockRejectedValue(error);

      await leaveServer(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
