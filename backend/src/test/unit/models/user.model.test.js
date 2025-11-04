import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../../services/user/User.model.js";

describe("User Model", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // 👇 Forzar construcción de índices (unique: true)
    await User.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test("Debe crear un usuario válido", async () => {
    const user = new User({
      username: "testuser",
      email: "test@mail.com",
      password: "hashedpassword123",
    });

    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe("testuser");
    expect(savedUser.email).toBe("test@mail.com");
    expect(savedUser.status).toBe("offline"); // valor por defecto
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });

  test("Debe fallar si falta un campo requerido (username)", async () => {
    const user = new User({
      email: "test@mail.com",
      password: "hashedpassword123",
    });

    let err;
    try {
      await user.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.username).toBeDefined();
  });

  test("Debe fallar si falta el email", async () => {
    const user = new User({
      username: "userWithoutEmail",
      password: "hashedpassword123",
    });

    let err;
    try {
      await user.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  test("Debe fallar si falta el password", async () => {
    const user = new User({
      username: "userWithoutPassword",
      email: "nopass@mail.com",
    });

    let err;
    try {
      await user.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  test("Debe fallar si el email no es único", async () => {
    const user1 = new User({
      username: "user1",
      email: "duplicate@mail.com",
      password: "12345",
    });
    await user1.save();

    const user2 = new User({
      username: "user2",
      email: "duplicate@mail.com", // duplicado
      password: "67890",
    });

    let err;
    try {
      await user2.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // error por índice único
  });

  test("Debe fallar si el username no es único", async () => {
    const user1 = new User({
      username: "duplicated",
      email: "user1@mail.com",
      password: "12345",
    });
    await user1.save();

    const user2 = new User({
      username: "duplicated", // duplicado
      email: "user2@mail.com",
      password: "67890",
    });

    let err;
    try {
      await user2.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // error por índice único
  });

  test("Debe respetar el enum en status", async () => {
    const user = new User({
      username: "userstatus",
      email: "status@mail.com",
      password: "hashedpassword123",
      status: "invalidstatus", // no válido
    });

    let err;
    try {
      await user.save();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
    expect(err.errors.status.kind).toBe("enum");
  });
});
