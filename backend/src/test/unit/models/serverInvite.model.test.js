import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import ServerInvite from "../../../models/serverInvite.js";

describe("ServerInvite Model", () => {
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
    await ServerInvite.deleteMany({});
  });

  const buildInvite = (overrides = {}) => {
    const defaults = {
      from: new mongoose.Types.ObjectId(),
      to: new mongoose.Types.ObjectId(),
      server: new mongoose.Types.ObjectId(),
    };
    return new ServerInvite({ ...defaults, ...overrides });
  };

  test("Debe crear una invitación válida con estado por defecto", async () => {
    const invite = buildInvite();
    const saved = await invite.save();

    expect(saved._id).toBeDefined();
    expect(saved.status).toBe("pending");
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
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

  test("Debe fallar si falta el remitente", async () => {
    const invite = buildInvite({ from: undefined });

    await expectValidationError(() => invite.save(), "from");
  });

  test("Debe fallar si falta el destinatario", async () => {
    const invite = buildInvite({ to: undefined });

    await expectValidationError(() => invite.save(), "to");
  });

  test("Debe fallar si falta el servidor", async () => {
    const invite = buildInvite({ server: undefined });

    await expectValidationError(() => invite.save(), "server");
  });

  test("Debe respetar el enum del estado", async () => {
    const invite = buildInvite({ status: "invalid" });

    await expectValidationError(() => invite.save(), "status");
  });

  test("Debe evitar duplicados por índice compuesto", async () => {
    const baseData = {
      from: new mongoose.Types.ObjectId(),
      to: new mongoose.Types.ObjectId(),
      server: new mongoose.Types.ObjectId(),
    };

    await new ServerInvite(baseData).save();

    await expect(new ServerInvite(baseData).save()).rejects.toMatchObject({
      code: 11000,
    });
  });
});
