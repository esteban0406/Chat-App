import { jest } from "@jest/globals";
import { Server } from "socket.io";
import { io as Client } from "socket.io-client";
import registerChatHandlers from "../../../sockets/chat.js";
import Message from "../../../models/Message.js";

jest.mock("../../../models/Message.js"); // evitar DB real

let io, serverSocket, clientSocket;

beforeAll((done) => {
  process.env.DISABLE_DB_WRITE = "true";
  io = new Server(4002, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    serverSocket = socket;
    registerChatHandlers(io, socket);
  });
  clientSocket = new Client("http://localhost:4002");
  clientSocket.on("connect", done);
});

afterAll(() => {
  io.close();
  clientSocket.close();
});

test("ignora mensaje sin campos obligatorios", (done) => {
  const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
  clientSocket.emit("message", { text: "" });
  setTimeout(() => {
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    done();
  }, 50);
});

test("emite mensaje fake cuando DISABLE_DB_WRITE=true", (done) => {
  clientSocket.emit("message", { text: "Hola", channelId: "chan", senderId: "usr" });
  clientSocket.on("message", (msg) => {
    expect(msg.text).toBe("Hola");
    expect(msg.channel).toBe("chan");
    expect(msg.sender).toBe("usr");
    done();
  });
});
