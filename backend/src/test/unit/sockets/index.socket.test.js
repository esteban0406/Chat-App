import { jest } from "@jest/globals";

const mockServerInstance = {
  on: jest.fn(),
};

const ServerMock = jest.fn(() => mockServerInstance);

const chatHandlersMock = jest.fn();
const voiceHandlersMock = jest.fn();
const channelHandlersMock = jest.fn();

jest.unstable_mockModule("socket.io", () => ({
  __esModule: true,
  Server: ServerMock,
}));

jest.unstable_mockModule("../../../sockets/chat.js", () => ({
  __esModule: true,
  default: chatHandlersMock,
}));

jest.unstable_mockModule("../../../sockets/voice.js", () => ({
  __esModule: true,
  default: voiceHandlersMock,
}));

jest.unstable_mockModule("../../../sockets/channels.js", () => ({
  __esModule: true,
  default: channelHandlersMock,
}));

const { setupSocket, getIO } = await import("../../../sockets/index.js");

describe("sockets/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServerInstance.on.mockImplementation(() => {});
  });

  test("getIO lanza error si no se ha inicializado", () => {
    expect(() => getIO()).toThrow("Socket.io not initialized yet!");
  });

  test("setupSocket inicializa Server con la configuración correcta", () => {
    const server = {};
    mockServerInstance.on.mockImplementation((event, handler) => {
      if (event === "connection") {
        const fakeSocket = {
          id: "socket-1",
          on: jest.fn(),
        };
        handler(fakeSocket);
      }
    });

    setupSocket(server);

    expect(ServerMock).toHaveBeenCalledWith(server, {
      cors: {
        origin: ["http://localhost:5173", "http://frontend:5173"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    const connectionHandler = mockServerInstance.on.mock.calls.find(
      ([event]) => event === "connection"
    )[1];
    expect(typeof connectionHandler).toBe("function");

    expect(chatHandlersMock).toHaveBeenCalled();
    expect(voiceHandlersMock).toHaveBeenCalled();
    expect(channelHandlersMock).toHaveBeenCalled();
  });

  test("getIO retorna la instancia después de setupSocket", () => {
    setupSocket({});
    const io = getIO();

    expect(io).toBe(mockServerInstance);
  });
});
