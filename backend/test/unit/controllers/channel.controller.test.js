import { jest } from "@jest/globals";
import { HttpError } from "../../../src/utils/httpError.js";

const ChannelMock = jest.fn();
ChannelMock.findById = jest.fn();
ChannelMock.findByIdAndDelete = jest.fn();

const ServerMock = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../../src/services/channel/Channel.model.js", () => ({
  __esModule: true,
  default: ChannelMock,
}));

jest.unstable_mockModule("../../../src/services/server/Server.model.js", () => ({
  __esModule: true,
  default: ServerMock,
}));

const { createChannel, getChannels, deleteChannel } = await import(
  "../../../src/services/channel/channel.controller.js"
);

const createChannelDoc = (overrides = {}) => {
  const doc = {
    _id: "channel123",
    name: "general",
    type: "text",
    server: "server123",
    messages: [],
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
      messages: doc.messages,
    }));

  return doc;
};

const createServerDoc = (overrides = {}) => {
  const server = {
    _id: "server123",
    members: ["user123"],
    channels: [],
    save: jest.fn().mockResolvedValue(undefined),
  };

  Object.assign(server, overrides);
  return server;
};

const createPopulateQuery = (resolvedValue) => {
  return {
    populate: jest.fn().mockResolvedValue(resolvedValue),
  };
};

describe("channel.controller", () => {
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
    ChannelMock.mockReset();
    ChannelMock.findById.mockReset();
    ChannelMock.findByIdAndDelete.mockReset();
    ServerMock.findById.mockReset();
    ServerMock.findByIdAndUpdate.mockReset();
  });

  describe("createChannel", () => {
    test("retorna 400 cuando faltan datos requeridos", async () => {
      req.body = { name: "", serverId: "" };

      await createChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("El nombre y el serverId son requeridos");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 404 si el servidor no existe", async () => {
      req.body = { name: "general", serverId: "server123" };
      ServerMock.findById.mockResolvedValue(null);

      await createChannel(req, res, next);

      expect(ServerMock.findById).toHaveBeenCalledWith("server123");
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("SERVER_NOT_FOUND");
      expect(error.message).toBe("Servidor no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 403 si el usuario no es miembro", async () => {
      req.body = { name: "general", serverId: "server123" };
      const server = createServerDoc({ members: ["otherUser"] });
      ServerMock.findById.mockResolvedValue(server);

      await createChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("No eres miembro de este servidor");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea canal y lo asocia al servidor", async () => {
      req.body = { name: "general", type: "text", serverId: "server123" };
      const channelInstance = createChannelDoc();
      ChannelMock.mockImplementation(() => channelInstance);
      const server = createServerDoc();
      ServerMock.findById.mockResolvedValue(server);

      await createChannel(req, res, next);

      expect(ChannelMock).toHaveBeenCalledWith({
        name: "general",
        type: "text",
        server: "server123",
      });
      expect(channelInstance.save).toHaveBeenCalled();
      expect(server.channels).toContain("channel123");
      expect(server.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Canal creado correctamente",
        data: {
          channel: {
            id: "channel123",
            name: "general",
            type: "text",
            server: "server123",
            messages: [],
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 ante errores inesperados", async () => {
      req.body = { name: "general", type: "text", serverId: "server123" };
      const error = new Error("save failed");
      ServerMock.findById.mockRejectedValue(error);

      await createChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getChannels", () => {
    test("retorna 404 cuando el servidor no existe", async () => {
      req.params = { serverId: "server123" };
      ServerMock.findById.mockReturnValue(createPopulateQuery(null));

      await getChannels(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("SERVER_NOT_FOUND");
      expect(error.message).toBe("Servidor no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 403 cuando el usuario no es miembro", async () => {
      req.params = { serverId: "server123" };
      const server = createServerDoc({ members: ["otherUser"], channels: [] });
      ServerMock.findById.mockReturnValue(createPopulateQuery(server));

      await getChannels(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("No eres miembro de este servidor");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve la lista de canales", async () => {
      req.params = { serverId: "server123" };
      const channelDoc = createChannelDoc();
      const server = createServerDoc({ channels: [channelDoc] });
      ServerMock.findById.mockReturnValue(createPopulateQuery(server));

      await getChannels(req, res, next);

      expect(ServerMock.findById).toHaveBeenCalledWith("server123");
      const populate = ServerMock.findById.mock.results[0].value.populate;
      expect(populate).toHaveBeenCalledWith("channels");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          channels: [
            {
              id: "channel123",
              name: "general",
              type: "text",
              server: "server123",
              messages: [],
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando hay errores", async () => {
      req.params = { serverId: "server123" };
      const error = new Error("lookup failed");
      ServerMock.findById.mockImplementation(() => {
        throw error;
      });

      await getChannels(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteChannel", () => {
    test("retorna 404 cuando el canal no existe", async () => {
      req.params = { channelId: "channel123" };
      ChannelMock.findById.mockResolvedValue(null);

      await deleteChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(404);
      expect(error.code).toBe("CHANNEL_NOT_FOUND");
      expect(error.message).toBe("Canal no encontrado");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("elimina el canal y actualiza el servidor", async () => {
      req.params = { channelId: "channel123" };
      const channel = createChannelDoc({ messages: undefined });
      ChannelMock.findById.mockResolvedValue(channel);
      ServerMock.findByIdAndUpdate.mockResolvedValue(undefined);
      ChannelMock.findByIdAndDelete.mockResolvedValue(undefined);

      await deleteChannel(req, res, next);

      expect(ServerMock.findByIdAndUpdate).toHaveBeenCalledWith("server123", {
        $pull: { channels: "channel123" },
      });
      expect(ChannelMock.findByIdAndDelete).toHaveBeenCalledWith("channel123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Canal eliminado correctamente",
        data: { channelId: "channel123" },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.params = { channelId: "channel123" };
      const error = new Error("delete failed");
      ChannelMock.findById.mockRejectedValue(error);

      await deleteChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
