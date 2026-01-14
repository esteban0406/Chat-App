import { jest } from "@jest/globals";
import { HttpError, validationError as createValidationError } from "../../../src/utils/httpError.js";

// Create mock service
const mockMessageService = {
  createMessage: jest.fn(),
  listMessages: jest.fn(),
};

// Mock the service module
jest.unstable_mockModule("../../../src/services/message/message.service.js", () => ({
  __esModule: true,
  createMessageService: jest.fn(() => mockMessageService),
  defaultMessageService: mockMessageService,
}));

const { createMessageController } = await import(
  "../../../src/services/message/message.controller.js"
);

const ioMock = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

const createMessageDoc = (overrides = {}) => {
  const doc = {
    _id: "message123",
    text: "Hola",
    sender: "user123",
    channel: "channel123",
    createdAt: new Date("2025-10-31T23:07:04.791Z"),
    toJSON: jest.fn(() => ({
      id: doc._id,
      text: doc.text,
      sender: doc.sender,
      channel: doc.channel,
      createdAt: doc.createdAt,
    })),
  };

  Object.assign(doc, overrides);
  if (overrides.toJSON) {
    doc.toJSON = overrides.toJSON;
  }

  return doc;
};

describe("message.controller", () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = createMessageController({
      messageService: mockMessageService,
      io: ioMock,
    });
    req = { body: {}, params: {}, authContext: { headers: {} } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
    ioMock.to.mockReturnThis();
    ioMock.to.mockClear();
    ioMock.emit.mockClear();
  });

  describe("sendMessage", () => {
    test("retorna 400 cuando faltan campos obligatorios", async () => {
      req.body = { text: "", senderId: "", channelId: "" };

      const validationError = createValidationError("Faltan campos obligatorios");
      mockMessageService.createMessage.mockRejectedValue(validationError);

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

      const messageDoc = createMessageDoc();
      const sender = { id: "user123", username: "test" };

      mockMessageService.createMessage.mockResolvedValue({
        message: messageDoc,
        sender,
      });

      await controller.sendMessage(req, res, next);

      expect(mockMessageService.createMessage).toHaveBeenCalledWith({
        text: "Hola",
        senderId: "user123",
        channelId: "channel123",
        authContext: req.authContext,
      });
      expect(ioMock.to).toHaveBeenCalledWith("channel123");
      expect(ioMock.emit).toHaveBeenCalledWith("message", {
        id: "message123",
        text: "Hola",
        sender: {
          id: "user123",
          username: "test",
        },
        channel: "channel123",
        createdAt: messageDoc.createdAt,
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
            createdAt: messageDoc.createdAt,
          },
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("retorna 500 cuando ocurre un error", async () => {
      req.body = { text: "Hola", senderId: "user123", channelId: "channel123" };
      const error = new Error("save failed");
      mockMessageService.createMessage.mockRejectedValue(error);

      await controller.sendMessage(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getMessages", () => {
    test("retorna mensajes del canal", async () => {
      req.params = { channelId: "channel123" };
      const messageDoc = createMessageDoc();
      const sender = { id: "user123", username: "test" };

      mockMessageService.listMessages.mockResolvedValue([
        { message: messageDoc, sender },
      ]);

      await controller.getMessages(req, res, next);

      expect(mockMessageService.listMessages).toHaveBeenCalledWith({
        channelId: "channel123",
        authContext: req.authContext,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: {
          messages: [
            {
              id: "message123",
              text: "Hola",
              sender: { id: "user123", username: "test" },
              channel: "channel123",
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
      mockMessageService.listMessages.mockRejectedValue(error);

      await controller.getMessages(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
