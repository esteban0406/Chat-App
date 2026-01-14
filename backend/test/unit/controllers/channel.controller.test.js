import { jest } from "@jest/globals";
import { HttpError, createHttpError, validationError } from "../../../src/utils/httpError.js";

// Create mock service
const mockChannelService = {
  createChannel: jest.fn(),
  listChannelsForServer: jest.fn(),
  updateChannel: jest.fn(),
  deleteChannel: jest.fn(),
};

// Mock the service module
jest.unstable_mockModule("../../../src/services/channel/channel.service.js", () => ({
  __esModule: true,
  createChannelService: jest.fn(() => mockChannelService),
  defaultChannelService: mockChannelService,
}));

const { createChannelController } = await import(
  "../../../src/services/channel/channel.controller.js"
);

const createChannelDoc = (overrides = {}) => {
  const doc = {
    _id: "channel123",
    name: "general",
    type: "text",
    server: "server123",
    messages: [],
    toJSON: jest.fn(() => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      server: doc.server,
      messages: doc.messages,
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
      messages: doc.messages,
    }));
  }

  return doc;
};

describe("channel.controller", () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = createChannelController({
      channelService: mockChannelService,
    });
    req = { body: {}, params: {}, user: { _id: "user123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("createChannel", () => {
    test("retorna 400 cuando faltan datos requeridos", async () => {
      req.body = { name: "", serverId: "" };

      const error = validationError("El nombre y el serverId son requeridos");
      mockChannelService.createChannel.mockRejectedValue(error);

      await controller.createChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(400);
      expect(receivedError.code).toBe("VALIDATION_ERROR");
      expect(receivedError.message).toBe("El nombre y el serverId son requeridos");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 404 si el servidor no existe", async () => {
      req.body = { name: "general", serverId: "server123" };

      const error = createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
      mockChannelService.createChannel.mockRejectedValue(error);

      await controller.createChannel(req, res, next);

      expect(mockChannelService.createChannel).toHaveBeenCalledWith({
        name: "general",
        type: undefined,
        serverId: "server123",
        requesterId: "user123",
      });
      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("SERVER_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 403 si el usuario no es miembro", async () => {
      req.body = { name: "general", serverId: "server123" };

      const error = createHttpError(403, "No eres miembro de este servidor", { code: "FORBIDDEN" });
      mockChannelService.createChannel.mockRejectedValue(error);

      await controller.createChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(403);
      expect(receivedError.code).toBe("FORBIDDEN");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea canal y lo asocia al servidor", async () => {
      req.body = { name: "general", type: "text", serverId: "server123" };

      const channelDoc = createChannelDoc();
      mockChannelService.createChannel.mockResolvedValue(channelDoc);

      await controller.createChannel(req, res, next);

      expect(mockChannelService.createChannel).toHaveBeenCalledWith({
        name: "general",
        type: "text",
        serverId: "server123",
        requesterId: "user123",
      });
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
      mockChannelService.createChannel.mockRejectedValue(error);

      await controller.createChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getChannels", () => {
    test("retorna 404 cuando el servidor no existe", async () => {
      req.params = { serverId: "server123" };

      const error = createHttpError(404, "Servidor no encontrado", { code: "SERVER_NOT_FOUND" });
      mockChannelService.listChannelsForServer.mockRejectedValue(error);

      await controller.getChannels(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("SERVER_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("retorna 403 cuando el usuario no es miembro", async () => {
      req.params = { serverId: "server123" };

      const error = createHttpError(403, "No eres miembro de este servidor", { code: "FORBIDDEN" });
      mockChannelService.listChannelsForServer.mockRejectedValue(error);

      await controller.getChannels(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(403);
      expect(receivedError.code).toBe("FORBIDDEN");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("devuelve la lista de canales", async () => {
      req.params = { serverId: "server123" };

      const channelDoc = createChannelDoc();
      mockChannelService.listChannelsForServer.mockResolvedValue([channelDoc]);

      await controller.getChannels(req, res, next);

      expect(mockChannelService.listChannelsForServer).toHaveBeenCalledWith({
        serverId: "server123",
        requesterId: "user123",
      });
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
      mockChannelService.listChannelsForServer.mockRejectedValue(error);

      await controller.getChannels(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteChannel", () => {
    test("retorna 404 cuando el canal no existe", async () => {
      req.params = { channelId: "channel123" };

      const error = createHttpError(404, "Canal no encontrado", { code: "CHANNEL_NOT_FOUND" });
      mockChannelService.deleteChannel.mockRejectedValue(error);

      await controller.deleteChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(HttpError);
      expect(receivedError.status).toBe(404);
      expect(receivedError.code).toBe("CHANNEL_NOT_FOUND");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("elimina el canal y actualiza el servidor", async () => {
      req.params = { channelId: "channel123" };

      mockChannelService.deleteChannel.mockResolvedValue(undefined);

      await controller.deleteChannel(req, res, next);

      expect(mockChannelService.deleteChannel).toHaveBeenCalledWith({
        channelId: "channel123",
      });
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
      mockChannelService.deleteChannel.mockRejectedValue(error);

      await controller.deleteChannel(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
