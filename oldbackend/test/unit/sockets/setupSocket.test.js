// test/unit/sockets/setupSocket.test.js
import { jest } from "@jest/globals";
import { createServer } from "http";
import { io as Client } from "socket.io-client";

// Mock jsonwebtoken before importing socket code
const mockVerify = jest.fn();
jest.unstable_mockModule("jsonwebtoken", () => ({
  __esModule: true,
  default: { verify: mockVerify },
}));

const { setupSocket, getIO } = await import("../../../src/sockets/index.js");

let server;
let clientSocket;
let connectionPromise;

beforeAll((done) => {
  process.env.JWT_SECRET = "testsecret";
  server = createServer();
  setupSocket(server);
  mockVerify.mockReturnValue({ id: "user123" });

  const io = getIO();
  connectionPromise = new Promise((resolve) => {
    io.once("connection", (socket) => resolve(socket));
  });

  server.listen(4003, () => {
    clientSocket = new Client("http://localhost:4003", {
      query: { token: "fake-token" },
    });
    clientSocket.on("connect", done);
  });
});

afterAll(async () => {
  clientSocket?.close();
  await new Promise((resolve) => server.close(resolve));
});

test("decodifica token JWT y asigna userId", async () => {
  const socket = await connectionPromise;
  expect(mockVerify).toHaveBeenCalledWith("fake-token", process.env.JWT_SECRET);
  expect(socket.data.userId).toBe("user123");
});
