import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../../../test/helpers/e2eServer.js";

// 🔹 Evitamos conflictos con mongoose.connect en tests
let app;
let serverModule;

beforeAll(async () => {
  ({ app } = await startE2EServer({
    extraRoutes: (expressApp) => {
      expressApp.get("/force-error", (req, res, next) => {
        next(new Error("Test error"));
      });
    },
    env: {
      GOOGLE_CLIENT_ID: "fake-client-id",
      GOOGLE_CLIENT_SECRET: "fake-client-secret",
      GOOGLE_CALLBACK_URL: "http://localhost:4000/auth/google/callback",
      MS_CLIENT_ID: "fake-ms-id",
      MS_CLIENT_SECRET: "fake-ms-secret",
    },
  }));

  // Importar después de levantar el servidor para reutilizar sus exports
  serverModule = await import("../../server.js");
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await stopE2EServer();
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
    expect(res.body).toMatchObject({
      success: false,
      message: "Unknown endpoint",
      code: "NOT_FOUND",
    });
  });

  test("Forzar error y validar errorHandler", async () => {
    const res = await request(app).get("/force-error");
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
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
