import { jest } from "@jest/globals";

const MessageMock = jest.fn();
MessageMock.find = jest.fn();
MessageMock.prototype.save = jest.fn().mockResolvedValue(undefined);
MessageMock.prototype.populate = jest.fn().mockResolvedValue(undefined);

const ChannelMock = {
  findById: jest.fn(),
};

const ioMock = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

jest.unstable_mockModule("../../../models/Message.js", () => ({
  __esModule: true,
  default: MessageMock,
}));

jest.unstable_mockModule("../../../models/Channel.js", () => ({
  __esModule: true,
  default: ChannelMock,
}));

const { messageController } = await import("../../../controllers/message.controller.js");

describe("message.controller", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = messageController(ioMock);
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    test("retorna 400 cuando faltan campos obligatorios", async () => {
      req.body = { text: "", senderId: "", channelId: "" };

      await controller.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Faltan campos obligatorios" });
    });

    test("crea mensaje, lo asocia y emite por socket", async () => {
      req.body = { text: "Hola", senderId: "user123", channelId: "channel123" };

      const messageInstance = {
        _id: "message123",
        text: "Hola",
        sender: { _id: "user123", username: "test" },
        channel: "channel123",
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };
      MessageMock.mockImplementation(() => messageInstance);

      const channel = {
        messages: [],
        save: jest.fn().mockResolvedValue(true),
      };
      ChannelMock.findById.mockResolvedValue(channel);

      await controller.sendMessage(req, res);

      expect(MessageMock).toHaveBeenCalledWith({
        text: "Hola",
        sender: "user123",
        channel: "channel123",
      });
      expect(messageInstance.save).toHaveBeenCalled();
      expect(ChannelMock.findById).toHaveBeenCalledWith("channel123");
      expect(channel.messages).toContain("message123");
      expect(channel.save).toHaveBeenCalled();
      expect(messageInstance.populate).toHaveBeenCalledWith("sender", "username");
      expect(ioMock.to).toHaveBeenCalledWith("channel123");
      expect(ioMock.emit).toHaveBeenCalledWith("message", expect.objectContaining({
        _id: "message123",
        text: "Hola",
        sender: messageInstance.sender,
        channel: "channel123",
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(messageInstance);
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.body = { text: "Hola", senderId: "user123", channelId: "channel123" };
      const error = new Error("save failed");
      MessageMock.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      await controller.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("getMessages", () => {
    test("retorna mensajes del canal", async () => {
      req.params = { channelId: "channel123" };
      const messages = [{ _id: "message123" }];
      MessageMock.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(messages),
        then: (resolve) => Promise.resolve(messages).then(resolve),
      });

      await controller.getMessages(req, res);

      expect(MessageMock.find).toHaveBeenCalledWith({ channel: "channel123" });
      expect(res.json).toHaveBeenCalledWith(messages);
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.params = { channelId: "channel123" };
      const error = new Error("lookup failed");
      MessageMock.find.mockImplementation(() => {
        throw error;
      });

      await controller.getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
