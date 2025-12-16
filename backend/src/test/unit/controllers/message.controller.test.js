import { jest } from "@jest/globals";
import { HttpError } from "../../../utils/httpError.js";

const MessageMock = jest.fn();
MessageMock.find = jest.fn();

const ChannelMock = {
  findById: jest.fn(),
};

const findByIdMock = jest.fn();
const findByIdsMock = jest.fn();

const ioMock = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

jest.unstable_mockModule("../../../services/message/Message.model.js", () => ({
  __esModule: true,
  default: MessageMock,
}));

jest.unstable_mockModule("../../../services/channel/Channel.model.js", () => ({
  __esModule: true,
  default: ChannelMock,
}));

jest.unstable_mockModule("../../../services/user/betterAuthUser.repository.js", () => ({
  __esModule: true,
  createBetterAuthUserRepository: () => ({
    findById: findByIdMock,
    findByIds: findByIdsMock,
  }),
}));

const { createMessageController } = await import(
  "../../../services/message/message.controller.js",
);

const createMessageDoc = (overrides = {}) => {
  const doc = {
    _id: "message123",
    text: "Hola",
    sender: { _id: "user123", username: "test" },
    channel: "channel123",
    createdAt: new Date("2025-10-31T23:07:04.791Z"),
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined),
  };

  Object.assign(doc, overrides);

  doc.populate.mockImplementation(async () => doc);
  doc.toObject =
    overrides.toObject ??
    jest.fn(() => ({
      _id: doc._id,
      text: doc.text,
      sender: doc.sender,
      channel: doc.channel,
      createdAt: doc.createdAt,
    }));

  return doc;
};

describe("message.controller", () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = createMessageController({ io: ioMock });
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
    MessageMock.mockReset();
    MessageMock.find.mockReset();
    ChannelMock.findById.mockReset();
    findByIdMock.mockReset();
    findByIdsMock.mockReset();
    findByIdsMock.mockResolvedValue([]);
    findByIdMock.mockResolvedValue({
      id: "user123",
      username: "test",
    });
    ioMock.to.mockReturnThis();
    ioMock.to.mockClear();
    ioMock.emit.mockClear();
  });

  describe("sendMessage", () => {
    test("retorna 400 cuando faltan campos obligatorios", async () => {
      req.body = { text: "", senderId: "", channelId: "" };

      await controller.sendMessage(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Faltan campos obligatorios");
      expect(res.status).not.toHaveBeenCalled();
    });

    test("crea mensaje, lo asocia y emite por socket", async () => {
      req.body = { text: "Hola", senderId: "user123", channelId: "channel123" };

      const messageInstance = createMessageDoc();
      MessageMock.mockImplementation(() => messageInstance);

      const channel = {
        messages: [],
        save: jest.fn().mockResolvedValue(undefined),
      };
      ChannelMock.findById.mockResolvedValue(channel);

      await controller.sendMessage(req, res, next);

      expect(MessageMock).toHaveBeenCalledWith({
        text: "Hola",
        sender: "user123",
        channel: "channel123",
      });
      expect(messageInstance.save).toHaveBeenCalled();
      expect(ChannelMock.findById).toHaveBeenCalledWith("channel123");
      expect(channel.messages).toContain("message123");
      expect(channel.save).toHaveBeenCalled();
      expect(findByIdMock).toHaveBeenCalledWith("user123");
      expect(ioMock.to).toHaveBeenCalledWith("channel123");
      expect(ioMock.emit).toHaveBeenCalledWith("message", {
        _id: "message123",
        text: "Hola",
        sender: {
          id: "user123",
          username: "test",
        },
        channel: "channel123",
        createdAt: messageInstance.createdAt,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Mensaje enviado",
        data: {
          message: {
            id: "message123",
            text: "Hola",
            sender: {
              id: "user123",
              username: "test",
            },
            channel: "channel123",
            createdAt: messageInstance.createdAt,
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.body = { text: "Hola", senderId: "user123", channelId: "channel123" };
      const error = new Error("save failed");
      MessageMock.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
        populate: jest.fn(),
      }));

      await controller.sendMessage(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getMessages", () => {
    test("retorna mensajes del canal", async () => {
      req.params = { channelId: "channel123" };
      const messageDocs = [
        createMessageDoc({
          _id: "message123",
          channel: "channel123",
          text: "Hola",
          sender: { _id: "user123", username: "test" },
          toObject: jest.fn(() => ({
            _id: "message123",
            channel: "channel123",
            text: "Hola",
            sender: { _id: "user123", username: "test" },
            createdAt: new Date("2025-10-31T23:07:04.791Z"),
          })),
        }),
      ];
      MessageMock.find.mockResolvedValue(messageDocs);
      findByIdsMock.mockResolvedValue([
        { id: "user123", username: "test" },
      ]);

      await controller.getMessages(req, res, next);

      expect(MessageMock.find).toHaveBeenCalledWith({ channel: "channel123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          messages: [
            {
              id: "message123",
              channel: "channel123",
              text: "Hola",
              sender: { id: "user123", username: "test" },
              createdAt: expect.any(Date),
            },
          ],
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.params = { channelId: "channel123" };
      const error = new Error("lookup failed");
      MessageMock.find.mockImplementation(() => {
        throw error;
      });

      await controller.getMessages(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
