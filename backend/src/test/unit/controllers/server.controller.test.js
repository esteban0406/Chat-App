import { jest } from "@jest/globals";

const ServerMock = jest.fn();
ServerMock.findById = jest.fn();
ServerMock.find = jest.fn();
ServerMock.findByIdAndDelete = jest.fn();

const ChannelMock = jest.fn();
ChannelMock.deleteMany = jest.fn();

jest.unstable_mockModule("../../../models/Server.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

jest.unstable_mockModule("../../../models/Channel.js", () => ({
  __esModule: true,
  default: ChannelMock,
}));

const { default: Server } = await import("../../../models/Server.js");
const { default: Channel } = await import("../../../models/Channel.js");
const {
  createServer,
  joinServer,
  getServers,
  deleteServer,
  removeMember,
  leaveServer,
} = await import("../../../controllers/server.controller.js");

const createPopulateQuery = (result) => {
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
  let consoleErrorSpy;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: "user123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("createServer", () => {
    test("retorna 400 si falta el nombre", async () => {
      req.body = { description: "sin nombre" };

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "El nombre es requerido" });
    });

    test("crea servidor y canal general", async () => {
      req.body = { name: "Test Server", description: "Servidor de prueba" };

      const mockServer = {
        _id: "server123",
        save: jest.fn().mockResolvedValue(true),
        channels: [],
        toObject: jest.fn().mockReturnValue({
          _id: "server123",
          name: "Test Server",
          description: "Servidor de prueba",
          owner: "user123",
          members: ["user123"],
          channels: [],
        }),
      };
      const mockChannel = {
        _id: "channel123",
        save: jest.fn().mockResolvedValue(true),
      };

      Server.mockImplementation(() => mockServer);
      Channel.mockImplementation(() => mockChannel);

      await createServer(req, res);

      expect(Server).toHaveBeenCalledWith({
        name: "Test Server",
        description: "Servidor de prueba",
        owner: "user123",
        members: ["user123"],
      });
      expect(Channel).toHaveBeenCalledWith({
        name: "general",
        type: "text",
        server: "server123",
      });
      expect(mockServer.save).toHaveBeenCalledTimes(2);
      expect(mockChannel.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "server123",
          defaultChannel: mockChannel,
        })
      );
    });

    test("maneja errores internos con status 500", async () => {
      req.body = { name: "Test Server" };
      const error = new Error("DB error");
      Server.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
        channels: [],
        toObject: jest.fn(),
      }));

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("joinServer", () => {
    test("retorna 404 si el servidor no existe", async () => {
      req.body = { serverId: "server123", userId: "user999" };
      Server.findById.mockResolvedValue(null);

      await joinServer(req, res);

      expect(Server.findById).toHaveBeenCalledWith("server123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Servidor no encontrado" });
    });

    test("agrega al usuario si no es miembro", async () => {
      req.body = { serverId: "server123", userId: "user999" };
      const mockServer = {
        members: ["user123"],
        save: jest.fn().mockResolvedValue(true),
      };
      mockServer.toObject = jest.fn(() => ({
        _id: "server123",
        name: "Server",
        members: [...mockServer.members],
        owner: "owner123",
      }));
      Server.findById.mockResolvedValue(mockServer);

      await joinServer(req, res);

      expect(mockServer.members).toContain("user999");
      expect(mockServer.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          members: ["user123", "user999"],
        })
      );
    });

    test("no duplica miembros existentes", async () => {
      req.body = { serverId: "server123", userId: "user123" };
      const mockServer = {
        members: ["user123"],
        save: jest.fn(),
      };
      mockServer.toObject = jest.fn(() => ({
        _id: "server123",
        name: "Server",
        members: [...mockServer.members],
        owner: "owner123",
      }));
      Server.findById.mockResolvedValue(mockServer);

      await joinServer(req, res);

      expect(mockServer.save).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          members: ["user123"],
        })
      );
    });

    test("maneja errores inesperados con 500", async () => {
      req.body = { serverId: "server123", userId: "user999" };
      const error = new Error("lookup failed");
      Server.findById.mockRejectedValue(error);

      await joinServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
    });
  });

  describe("getServers", () => {
    test("retorna servidores del usuario", async () => {
      const serverDoc = {
        _id: "server123",
        owner: "owner123",
        members: ["user123"],
        channels: [],
      };
      serverDoc.toObject = () => ({
        _id: "server123",
        owner: "owner123",
        members: ["user123"],
        channels: [],
      });
      const servers = [serverDoc];
      Server.find.mockReturnValue(createPopulateQuery(servers));

      await getServers(req, res);

      expect(Server.find).toHaveBeenCalledWith({ members: "user123" });
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          _id: "server123",
          members: ["user123"],
          owner: "owner123",
        }),
      ]);
    });

    test("devuelve 500 ante errores", async () => {
      const error = new Error("query failed");
      Server.find.mockImplementation(() => {
        throw error;
      });

      await getServers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
    });
  });

  describe("deleteServer", () => {
    test("retorna 400 si falta serverId", async () => {
      req.params = {};

      await deleteServer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Se requiere el serverId" });
    });

    test("elimina servidor y canales asociados", async () => {
      req.params = { serverId: "server123" };
      Channel.deleteMany.mockResolvedValue({ deletedCount: 3 });
      Server.findByIdAndDelete.mockResolvedValue({ _id: "server123" });

      await deleteServer(req, res);

      expect(Channel.deleteMany).toHaveBeenCalledWith({ server: "server123" });
      expect(Server.findByIdAndDelete).toHaveBeenCalledWith("server123");
      expect(res.json).toHaveBeenCalledWith({ message: "Servidor eliminado con éxito" });
    });

    test("devuelve 500 cuando ocurre un error", async () => {
      req.params = { serverId: "server123" };
      const error = new Error("delete failed");
      Channel.deleteMany.mockRejectedValue(error);

      await deleteServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
    });
  });

  describe("removeMember", () => {
    test("retorna 404 cuando no encuentra el servidor", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      Server.findById.mockResolvedValue(null);

      await removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Servidor no encontrado" });
    });

    test("retorna 403 si el usuario no es el dueño", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      const mockServer = {
        owner: "otherOwner",
        members: ["user456"],
      };
      Server.findById.mockResolvedValue(mockServer);

      await removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Solo el dueño puede eliminar miembros",
      });
    });

    test("retorna 400 si el miembro no pertenece al servidor", async () => {
      req.params = { serverId: "server123", memberId: "user999" };
      const mockServer = {
        owner: "user123",
        members: ["user456"],
      };
      Server.findById.mockResolvedValue(mockServer);

      await removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "El miembro no pertenece al servidor",
      });
    });

    test("elimina miembro y devuelve servidor actualizado", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      const mockServer = {
        owner: "user123",
        members: ["user123", "user456"],
        save: jest.fn().mockResolvedValue(true),
      };
      mockServer.toObject = jest.fn(() => ({
        _id: "server123",
        members: [...mockServer.members],
      }));
      Server.findById.mockResolvedValue(mockServer);

      await removeMember(req, res);

      expect(mockServer.members).toEqual(["user123"]);
      expect(mockServer.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        _id: "server123",
        members: ["user123"],
      });
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { serverId: "server123", memberId: "user456" };
      const error = new Error("lookup failed");
      Server.findById.mockRejectedValue(error);

      await removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
    });
  });

  describe("leaveServer", () => {
    test("retorna 400 si falta serverId", async () => {
      req.params = {};

      await leaveServer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Se requiere el serverId" });
    });

    test("retorna 404 si el servidor no existe", async () => {
      req.params = { serverId: "server123" };
      Server.findById.mockResolvedValue(null);

      await leaveServer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Servidor no encontrado" });
    });

    test("remueve al usuario del servidor", async () => {
      req.params = { serverId: "server123" };
      req.user = { _id: "user123" };
      const mockServer = {
        owner: "owner999",
        members: ["user123", "user999"],
        save: jest.fn().mockResolvedValue(true),
      };
      Server.findById.mockResolvedValue(mockServer);

      await leaveServer(req, res);

      expect(mockServer.members).toEqual(["user999"]);
      expect(mockServer.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: "Has salido del servidor" });
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.params = { serverId: "server123" };
      const error = new Error("lookup failed");
      Server.findById.mockRejectedValue(error);

      await leaveServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
    });
  });
});
