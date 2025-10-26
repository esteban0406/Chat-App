// tests/sockets/channelHandlers.test.js
import { Server } from "socket.io";
import { io as Client } from "socket.io-client";
import registerChannelHandlers from "../../../sockets/channels.js";

let io, serverSocket, clientSocket;

beforeAll((done) => {
  io = new Server(4001, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    serverSocket = socket;
    registerChannelHandlers(io, socket);
  });
  clientSocket = new Client("http://localhost:4001");
  clientSocket.on("connect", done);
});

afterAll(() => {
  io.close();
  clientSocket.close();
});

test("joinChannel guarda channelId en socket.data", (done) => {
  clientSocket.emit("joinChannel", "123");
  setTimeout(() => {
    expect(serverSocket.data.channelId).toBe("123");
    done();
  }, 50);
});

test("leaveChannel elimina channelId", (done) => {
  serverSocket.data = { channelId: "123" };
  clientSocket.emit("leaveChannel", "123");
  setTimeout(() => {
    expect(serverSocket.data.channelId).toBeUndefined();
    done();
  }, 50);
});
