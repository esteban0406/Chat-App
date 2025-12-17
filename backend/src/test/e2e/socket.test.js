import { io as Client } from "socket.io-client";
import mongoose from "mongoose";

// Importa modelos reales
import Channel from "../../services/channel/Channel.model.js";
import Server from "../../services/server/Server.model.js";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../../../test/helpers/e2eServer.js";

let clientA;
let clientB;
let serverInfo;

beforeAll(async () => {
  serverInfo = await startE2EServer({
    env: { DISABLE_DB_WRITE: "false" },
  });

  clientA = new Client(serverInfo.url, { query: { token: "fake" } });
  clientB = new Client(serverInfo.url, { query: { token: "fake" } });

  await Promise.all([
    new Promise((resolve) => clientA.on("connect", resolve)),
    new Promise((resolve) => clientB.on("connect", resolve)),
  ]);
});

afterEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  clientA?.close();
  clientB?.close();
  await stopE2EServer();
});

describe("Sockets E2E con DB real", () => {
  test("cliente A envía mensaje guardado en Mongo y cliente B lo recibe", async () => {
    // Crear un usuario ficticio representado por un ObjectId
    const userId = new mongoose.Types.ObjectId();

    // Crear Server
    const serverDoc = await Server.create({
      name: "server-prueba",
      description: "Servidor para test",
      owner: userId,
      members: [userId],
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
          expect(msg.sender.toString()).toBe(userId.toString());

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
      senderId: userId.toString(),
    });

    return msgPromise;
  });
});
