import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// 🔹 Evitamos conflictos con mongoose.connect en tests
let app, server, mongo, serverModule;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "testsecret";

  // Import dinámico para poder inyectar rutas extra
  serverModule = await import("../../server.js");

  const result = await serverModule.createServer({
    extraRoutes: (app) => {
      // 👉 Inyectamos ruta de error solo en test
      app.get("/force-error", (req, res, next) => {
        next(new Error("Test error"));
      });
    },
  });

  app = result.app;
  server = result.server;

  await new Promise((resolve) => server.listen(4060, resolve));
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongo) await mongo.stop();
  if (server) server.close();
});

describe("server.js extra coverage", () => {
  test("GET / devuelve mensaje de API funcionando", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("API funcionando 🚀");
  });

  test("GET /ruta-inexistente devuelve 404 con unknownEndpoint", async () => {
    const res = await request(app).get("/ruta-inexistente");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "unknown endpoint");
  });

  test("Forzar error y validar errorHandler", async () => {
    const res = await request(app).get("/force-error");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Test error");
  });

  test("startServer maneja SIGINT y cierra conexión", async () => {
    const startServer = serverModule.startServer;
    const listenMock = jest.fn((port, cb) => cb && cb());
    const closeMock = jest.fn((cb) => cb && cb());
    const disconnectSpy = jest
      .spyOn(mongoose, "disconnect")
      .mockResolvedValue();

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await startServer(async () => ({
      server: {
        listen: listenMock,
        close: closeMock,
      },
    }));

    // Simular SIGINT
    process.emit("SIGINT");
    await new Promise((resolve) => setImmediate(resolve));

    expect(logSpy).toHaveBeenCalledWith("🛑 Shutting down...");
    expect(logSpy).toHaveBeenCalledWith("👋 Server closed gracefully");
    expect(exitSpy).toHaveBeenCalledWith(0);

    disconnectSpy.mockRestore();
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
