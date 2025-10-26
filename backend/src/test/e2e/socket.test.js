import { io as Client } from "socket.io-client";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Importa modelos reales
import User from "../../models/User.js";
import Channel from "../../models/Channel.js";
import Server from "../../models/Server.js";

let appServer;
let mongo;
let clientA, clientB;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "testsecret";
  process.env.NODE_ENV = "test";
  process.env.DISABLE_DB_WRITE = "false"; // usamos DB real

  const { createServer } = await import("../../server.js");
  const { server } = await createServer();
  appServer = server;

  await new Promise((resolve) => server.listen(4030, resolve));

  clientA = new Client("http://localhost:4030", { query: { token: "fake" } });
  clientB = new Client("http://localhost:4030", { query: { token: "fake" } });

  await Promise.all([
    new Promise((resolve) => clientA.on("connect", resolve)),
    new Promise((resolve) => clientB.on("connect", resolve)),
  ]);
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  clientA?.close();
  clientB?.close();
  await mongoose.disconnect();
  await mongo.stop();
  await new Promise((resolve) => appServer.close(resolve));
});

describe("Sockets E2E con DB real", () => {
  test("cliente A envía mensaje guardado en Mongo y cliente B lo recibe", async () => {
    // Crear User
    const user = await User.create({
      username: "testuser",
      email: "test@mail.com",
      password: "hashed",
    });

    // Crear Server
    const serverDoc = await Server.create({
      name: "server-prueba",
      description: "Servidor para test",
      owner: user._id,
      members: [user._id],
      channels: [],
    });

    // Crear Channel asociado al Server
    const channel = await Channel.create({
      name: "general",
      type: "text",
      server: serverDoc._id,
    });

    // Asociar canal al server
    serverDoc.channels.push(channel._id);
    await serverDoc.save();

    // Promesa para escuchar desde cliente B
    const msgPromise = new Promise((resolve, reject) => {
      clientB.once("message", async (msg) => {
        try {
          expect(msg.text).toBe("Hola DB");
          expect(msg.channel.toString()).toBe(channel._id.toString());
          expect(msg.sender.toString()).toBe(user._id.toString());

          // Verificar que realmente se guardó en DB
          const stored = await mongoose.connection
            .collection("messages")
            .findOne({ _id: new mongoose.Types.ObjectId(msg._id) });
          expect(stored).not.toBeNull();

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    // Emitir mensaje
    clientA.emit("message", {
      text: "Hola DB",
      channelId: channel._id.toString(),
      senderId: user._id.toString(),
    });

    return msgPromise;
  });
});
