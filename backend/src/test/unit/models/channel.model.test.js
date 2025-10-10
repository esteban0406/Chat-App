import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Channel from "../../../models/Channel.js";

describe("Channel Model", () => {
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
    await Channel.deleteMany({});
  });

  const expectValidationError = async (operation, field) => {
    try {
      await operation();
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.name).toBe("ValidationError");
      expect(err.errors[field]).toBeDefined();
      return;
    }
    throw new Error("Expected validation error");
  };

  const buildChannel = (overrides = {}) => {
    const defaults = {
      name: "general",
      type: "text",
      server: new mongoose.Types.ObjectId(),
      messages: [],
    };
    return new Channel({ ...defaults, ...overrides });
  };

  test("Debe crear un canal válido con valores por defecto", async () => {
    const channel = buildChannel();
    const saved = await channel.save();

    expect(saved._id).toBeDefined();
    expect(saved.name).toBe("general");
    expect(saved.type).toBe("text");
    expect(saved.server.toString()).toBe(channel.server.toString());
    expect(saved.messages).toEqual([]);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  test("Debe fallar si falta el nombre", async () => {
    const channel = buildChannel({ name: undefined });

    await expectValidationError(() => channel.save(), "name");
  });

  test("Debe fallar si falta el server", async () => {
    const channel = buildChannel({ server: undefined });

    await expectValidationError(() => channel.save(), "server");
  });

  test("Debe respetar el enum del tipo", async () => {
    const channel = buildChannel({ type: "invalid" });

    await expectValidationError(() => channel.save(), "type");
  });

  test("Debe permitir agregar mensajes", async () => {
    const messageId = new mongoose.Types.ObjectId();
    const channel = buildChannel({ messages: [messageId] });
    const saved = await channel.save();

    expect(saved.messages.map((id) => id.toString())).toEqual([messageId.toString()]);
  });
});
