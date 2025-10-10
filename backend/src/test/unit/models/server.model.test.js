import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Server from "../../../models/Server.js";

describe("Server Model", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  afterEach(async () => {
    await Server.deleteMany({});
  });

  test("Debe crear un servidor válido", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const server = new Server({
      name: "Servidor de prueba",
      description: "Descripción opcional",
      owner: ownerId,
    });

    const savedServer = await server.save();

    expect(savedServer._id).toBeDefined();
    expect(savedServer.name).toBe("Servidor de prueba");
    expect(savedServer.description).toBe("Descripción opcional");
    expect(savedServer.owner.toString()).toBe(ownerId.toString());
    expect(savedServer.members).toEqual([]);
    expect(savedServer.channels).toEqual([]);
    expect(savedServer.createdAt).toBeInstanceOf(Date);
    expect(savedServer.updatedAt).toBeInstanceOf(Date);
  });

  test("Debe fallar si falta el nombre", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const server = new Server({
      description: "Sin nombre",
      owner: ownerId,
    });

    let err;
    try {
      await server.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
  });

  test("Debe fallar si falta el owner", async () => {
    const server = new Server({
      name: "Servidor sin dueño",
    });

    let err;
    try {
      await server.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.owner).toBeDefined();
  });

  test("Debe permitir agregar miembros y canales", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const memberId = new mongoose.Types.ObjectId();
    const channelId = new mongoose.Types.ObjectId();

    const server = new Server({
      name: "Servidor con datos",
      owner: ownerId,
      members: [ownerId],
      channels: [],
    });

    server.members.push(memberId);
    server.channels.push(channelId);

    const savedServer = await server.save();

    expect(savedServer.members.map((m) => m.toString())).toEqual(
      expect.arrayContaining([ownerId.toString(), memberId.toString()])
    );
    expect(savedServer.channels.map((c) => c.toString())).toEqual(
      expect.arrayContaining([channelId.toString()])
    );
  });
});
