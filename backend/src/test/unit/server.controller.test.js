import { jest } from "@jest/globals";

// 🔹 Mockear primero
jest.unstable_mockModule("../../models/Server.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.unstable_mockModule("../../models/Channel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// 🔹 Importar dinámicamente después
const { default: Server } = await import("../../models/Server.js");
const { default: Channel } = await import("../../models/Channel.js");
const { createServer } = await import("../../controllers/server.controller.js");

describe("server.controller - createServer", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { name: "Test Server", description: "Servidor de prueba" },
      user: { _id: "user123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("Debe retornar 400 si falta el nombre", async () => {
    req.body = { description: "sin nombre" };

    await createServer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "El nombre es requerido" });
  });

  test("Debe crear un servidor y un canal general", async () => {
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

    expect(mockServer.save).toHaveBeenCalled();
    expect(mockChannel.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "server123",
        defaultChannel: mockChannel,
      })
    );
  });

  test("Debe manejar errores internos con status 500", async () => {
    Server.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("DB error")),
    }));

    await createServer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "DB error" })
    );
  });
});
