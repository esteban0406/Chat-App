import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Message from "../../../src/services/message/Message.model.js";

describe("Message Model", () => {
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
    await Message.deleteMany({});
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

  const buildMessage = (overrides = {}) => {
    const defaults = {
      text: "Hola mundo",
      sender: new mongoose.Types.ObjectId(),
      channel: new mongoose.Types.ObjectId(),
    };
    return new Message({ ...defaults, ...overrides });
  };

  test("Debe crear un mensaje válido con valores por defecto", async () => {
    const message = buildMessage();
    const saved = await message.save();

    expect(saved._id).toBeDefined();
    expect(saved.text).toBe("Hola mundo");
    expect(saved.sender.toString()).toBe(message.sender.toString());
    expect(saved.channel.toString()).toBe(message.channel.toString());
    expect(saved.timestamp).toBeInstanceOf(Date);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  test("Debe fallar si falta el texto", async () => {
    const message = buildMessage({ text: undefined });

    await expectValidationError(() => message.save(), "text");
  });

  test("Debe fallar si falta el sender", async () => {
    const message = buildMessage({ sender: undefined });

    await expectValidationError(() => message.save(), "sender");
  });

  test("Debe fallar si falta el channel", async () => {
    const message = buildMessage({ channel: undefined });

    await expectValidationError(() => message.save(), "channel");
  });

  test("Debe permitir establecer un timestamp personalizado", async () => {
    const customDate = new Date("2024-01-01T00:00:00Z");
    const message = buildMessage({ timestamp: customDate });
    const saved = await message.save();

    expect(saved.timestamp.toISOString()).toBe(customDate.toISOString());
  });
});
