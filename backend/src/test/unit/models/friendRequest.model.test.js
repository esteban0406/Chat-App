import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import FriendRequest from "../../../models/friendRequest.js";

describe("FriendRequest Model", () => {
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
    await FriendRequest.deleteMany({});
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

  const buildRequest = (overrides = {}) => {
    const defaults = {
      from: new mongoose.Types.ObjectId(),
      to: new mongoose.Types.ObjectId(),
      status: "pending",
    };
    return new FriendRequest({ ...defaults, ...overrides });
  };

  test("Debe crear una solicitud válida con estado por defecto", async () => {
    const request = buildRequest();
    const saved = await request.save();

    expect(saved._id).toBeDefined();
    expect(saved.status).toBe("pending");
    expect(saved.from.toString()).toBe(request.from.toString());
    expect(saved.to.toString()).toBe(request.to.toString());
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  test("Debe fallar si falta el remitente", async () => {
    const request = buildRequest({ from: undefined });

    await expectValidationError(() => request.save(), "from");
  });

  test("Debe fallar si falta el destinatario", async () => {
    const request = buildRequest({ to: undefined });

    await expectValidationError(() => request.save(), "to");
  });

  test("Debe respetar el enum del estado", async () => {
    const request = buildRequest({ status: "invalid" });

    await expectValidationError(() => request.save(), "status");
  });

  test("Debe permitir actualizar el estado a aceptado", async () => {
    const request = buildRequest();
    const saved = await request.save();

    saved.status = "accepted";
    const updated = await saved.save();

    expect(updated.status).toBe("accepted");
    expect(updated.updatedAt.getTime()).toBeGreaterThan(saved.createdAt.getTime());
  });
});
