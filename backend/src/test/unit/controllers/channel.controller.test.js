import { jest } from "@jest/globals";

const ChannelMock = jest.fn();
ChannelMock.findById = jest.fn();
ChannelMock.findByIdAndDelete = jest.fn();
ChannelMock.prototype.save = jest.fn();

const ServerMock = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../../models/Channel.js", () => ({
  __esModule: true,
  default: ChannelMock,
}));

jest.unstable_mockModule("../../../models/Server.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

const {
  createChannel,
  getChannels,
  deleteChannel,
} = await import("../../../controllers/channel.controller.js");

const createPopulateQuery = (result) => {
  const query = {
    populate: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  query.populate.mockImplementation(() => query);
  query.then = (resolve, reject) => query.exec().then(resolve, reject);
  return query;
};

describe("channel.controller", () => {
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

  describe("createChannel", () => {
    test("retorna 400 cuando faltan datos requeridos", async () => {
      req.body = { name: "", serverId: "" };

      await createChannel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "El nombre y el serverId son requeridos",
      });
    });

    test("retorna 404 si el servidor no existe", async () => {
      req.body = { name: "general", serverId: "server123" };
      ServerMock.findById.mockResolvedValue(null);

      await createChannel(req, res);

      expect(ServerMock.findById).toHaveBeenCalledWith("server123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Servidor no encontrado" });
    });

    test("retorna 403 si el usuario no es miembro", async () => {
      req.body = { name: "general", serverId: "server123" };
      const server = { members: ["otherUser"] };
      ServerMock.findById.mockResolvedValue(server);

      await createChannel(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "No eres miembro de este servidor",
      });
    });

    test("crea canal y lo asocia al servidor", async () => {
      req.body = { name: "general", type: "text", serverId: "server123" };
      req.user = { _id: "user123" };

      const channelInstance = { _id: "channel123", save: jest.fn().mockResolvedValue(true) };
      ChannelMock.mockImplementation(() => channelInstance);

      const server = {
        members: ["user123"],
        channels: [],
        save: jest.fn().mockResolvedValue(true),
      };
      ServerMock.findById.mockResolvedValue(server);

      await createChannel(req, res);

      expect(ChannelMock).toHaveBeenCalledWith({
        name: "general",
        type: "text",
        server: "server123",
      });
      expect(channelInstance.save).toHaveBeenCalled();
      expect(server.channels).toContain("channel123");
      expect(server.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(channelInstance);
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { name: "general", type: "text", serverId: "server123" };
      const error = new Error("save failed");
      ServerMock.findById.mockRejectedValue(error);

      await createChannel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("getChannels", () => {
    test("retorna 404 cuando el servidor no existe", async () => {
      req.params = { serverId: "server123" };
      ServerMock.findById.mockReturnValue(createPopulateQuery(null));

      await getChannels(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Servidor no encontrado" });
    });

    test("retorna 403 cuando el usuario no es miembro", async () => {
      req.params = { serverId: "server123" };
      const server = { members: ["otherUser"], channels: [] };
      ServerMock.findById.mockReturnValue(createPopulateQuery(server));

      await getChannels(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "No eres miembro de este servidor",
      });
    });

    test("devuelve la lista de canales", async () => {
      req.params = { serverId: "server123" };
      const server = { members: ["user123"], channels: [{ _id: "channel123" }] };
      ServerMock.findById.mockReturnValue(createPopulateQuery(server));

      await getChannels(req, res);

      expect(res.json).toHaveBeenCalledWith(server.channels);
    });

    test("retorna 500 cuando hay errores", async () => {
      req.params = { serverId: "server123" };
      const error = new Error("lookup failed");
      ServerMock.findById.mockImplementation(() => {
        throw error;
      });

      await getChannels(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("deleteChannel", () => {
    test("retorna 404 cuando el canal no existe", async () => {
      req.params = { channelId: "channel123" };
      ChannelMock.findById.mockResolvedValue(null);

      await deleteChannel(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Canal no encontrado" });
    });

    test("elimina el canal y actualiza el servidor", async () => {
      req.params = { channelId: "channel123" };
      const channel = { _id: "channel123", server: "server123" };
      ChannelMock.findById.mockResolvedValue(channel);
      ServerMock.findByIdAndUpdate.mockResolvedValue(true);
      ChannelMock.findByIdAndDelete.mockResolvedValue(true);

      await deleteChannel(req, res);

      expect(ServerMock.findByIdAndUpdate).toHaveBeenCalledWith("server123", {
        $pull: { channels: "channel123" },
      });
      expect(ChannelMock.findByIdAndDelete).toHaveBeenCalledWith("channel123");
      expect(res.json).toHaveBeenCalledWith({
        message: "Canal eliminado correctamente",
        channelId: "channel123",
      });
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.params = { channelId: "channel123" };
      const error = new Error("delete failed");
      ChannelMock.findById.mockRejectedValue(error);

      await deleteChannel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
