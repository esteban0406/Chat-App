import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const accessTokenCalls = [];
const addGrantMock = jest.fn();
const toJwtMock = jest.fn().mockResolvedValue("mock-jwt");

jest.unstable_mockModule("livekit-server-sdk", () => ({
  __esModule: true,
  AccessToken: class {
    constructor(key, secret, options) {
      accessTokenCalls.push({ key, secret, options });
      this.addGrant = addGrantMock;
    }
    addGrant(grant) {
      addGrantMock(grant);
    }
    async toJwt() {
      return toJwtMock();
    }
  },
}));

let app;
let server;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "testsecret";
  process.env.LIVEKIT_API_KEY = "lk-key";
  process.env.LIVEKIT_API_SECRET = "lk-secret";
  process.env.LIVEKIT_URL = "wss://livekit.test";

  const { createServer } = await import("../../server.js");
  const result = await createServer();
  app = result.app;
  server = result.server;
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
  }
  accessTokenCalls.length = 0;
  addGrantMock.mockClear();
  toJwtMock.mockClear();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  if (server) server.close();
});

describe("/api/voice E2E", () => {
  test("POST /api/voice/join devuelve token y url", async () => {
    const res = await request(app).post("/api/voice/join").send({
      identity: "user-1",
      room: "room-abc",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      token: "mock-jwt",
      url: "wss://livekit.test",
    });
    expect(accessTokenCalls).toHaveLength(1);
    expect(accessTokenCalls[0]).toEqual({
      key: "lk-key",
      secret: "lk-secret",
      options: { identity: "user-1" },
    });
    expect(addGrantMock).toHaveBeenCalledWith({ roomJoin: true, room: "room-abc" });
    expect(toJwtMock).toHaveBeenCalled();
  });

  test("POST /api/voice/join valida campos requeridos", async () => {
    const res = await request(app).post("/api/voice/join").send({
      identity: "",
      room: "",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "identity y room requeridos");
    expect(accessTokenCalls).toHaveLength(0);
  });
});
