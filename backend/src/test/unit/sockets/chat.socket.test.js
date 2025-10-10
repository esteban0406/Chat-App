import { jest } from "@jest/globals";

const MessageMock = jest.fn();

jest.unstable_mockModule("../../../models/Message.js", () => ({
  __esModule: true,
  default: MessageMock,
}));

const { default: registerChatHandlers } = await import("../../../sockets/chat.js");

describe("sockets/chat", () => {
  let socket;
  let io;
  let events;

  beforeEach(() => {
    events = {};
    socket = {
      on: jest.fn((event, handler) => {
        events[event] = handler;
      }),
    };
    io = {
      emit: jest.fn(),
    };
    jest.clearAllMocks();
    MessageMock.mockReset();
  });

  test("guarda y emite mensajes recibidos", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const messageInstance = { save: saveMock };
    MessageMock.mockImplementation(() => messageInstance);

    registerChatHandlers(io, socket);

    expect(socket.on).toHaveBeenCalledWith("message", expect.any(Function));

    const payload = {
      text: "hola",
      sender: "user123",
      channel: "channel123",
    };
    await events.message(payload);

    expect(MessageMock).toHaveBeenCalledWith(payload);
    expect(saveMock).toHaveBeenCalled();
    expect(io.emit).toHaveBeenCalledWith("message", messageInstance);
  });

  test("maneja errores al guardar mensajes", async () => {
    const error = new Error("db down");
    const saveMock = jest.fn().mockRejectedValue(error);
    const messageInstance = { save: saveMock };
    MessageMock.mockImplementation(() => messageInstance);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    registerChatHandlers(io, socket);

    const payload = {
      text: "fail",
      sender: "user123",
      channel: "channel123",
    };
    await events.message(payload);

    expect(consoleSpy).toHaveBeenCalledWith("❌ Error saving message:", error);
    expect(io.emit).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
