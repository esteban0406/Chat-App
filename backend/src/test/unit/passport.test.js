import { jest } from "@jest/globals";

// Mock de User.js (no usamos DB real aquí)
jest.unstable_mockModule("../../models/User.js", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

describe("Passport strategies (unit con mocks)", () => {
  let passport;
  let User;

  beforeEach(async () => {
    jest.resetModules(); // limpiar imports y mocks
    process.env.GOOGLE_CLIENT_ID = "fake-google-id";
    process.env.GOOGLE_CLIENT_SECRET = "fake-google-secret";
    process.env.MS_CLIENT_ID = "fake-ms-id";
    process.env.MS_CLIENT_SECRET = "fake-ms-secret";

    ({ default: User } = await import("../../models/User.js"));
    passport = (await import("../../config/passport.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GoogleStrategy crea usuario nuevo", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ email: "g@test.com", username: "Google User" });

    const profile = {
      displayName: "Google User",
      emails: [{ value: "g@test.com" }],
      photos: [{ value: "http://avatar.com" }],
    };

    const done = jest.fn();
    const strategy = passport._strategies.google;

    await strategy._verify("token", "refresh", profile, done);

    expect(User.findOne).toHaveBeenCalledWith({ email: "g@test.com" });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "Google User",
        email: "g@test.com",
        provider: "google",
      })
    );
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ email: "g@test.com" }));
  });

  test("GoogleStrategy actualiza usuario existente", async () => {
    const existingUser = {
      email: "g@test.com",
      username: "Old",
      avatar: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(existingUser);

    const profile = {
      displayName: "Updated Google",
      emails: [{ value: "g@test.com" }],
      photos: [{ value: "http://new-avatar.com" }],
    };

    const done = jest.fn();
    const strategy = passport._strategies.google;

    await strategy._verify("token", "refresh", profile, done);

    expect(existingUser.username).toBe("Updated Google");
    expect(existingUser.avatar).toBe("http://new-avatar.com");
    expect(existingUser.save).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, existingUser);
  });

  test("MicrosoftStrategy crea usuario nuevo", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ email: "ms@test.com", username: "MS User" });

    const profile = {
      displayName: "MS User",
      _json: {
        preferred_username: "ms@test.com",
        name: "MS User",
        picture: "http://ms-avatar.com/avatar.png",
      },
    };

    const done = jest.fn();
    const strategy = passport._strategies["azuread-openidconnect"];

    await strategy._verify("iss", "sub", profile, "token", "refresh", done);

    expect(User.findOne).toHaveBeenCalledWith({ email: "ms@test.com" });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "MS User",
        email: "ms@test.com",
        provider: "microsoft",
      })
    );
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ email: "ms@test.com" }));
  });

  test("MicrosoftStrategy actualiza usuario existente", async () => {
    const existingUser = {
      email: "ms@test.com",
      username: "OldMS",
      avatar: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(existingUser);

    const profile = {
      displayName: "Updated MS",
      _json: {
        preferred_username: "ms@test.com",
        name: "Updated MS",
        picture: "http://new-ms-avatar.png",
      },
    };

    const done = jest.fn();
    const strategy = passport._strategies["azuread-openidconnect"];

    await strategy._verify("iss", "sub", profile, "token", "refresh", done);

    expect(existingUser.username).toBe("Updated MS");
    expect(existingUser.avatar).toBe("http://new-ms-avatar.png");
    expect(existingUser.save).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, existingUser);
  });

  test("serializeUser y deserializeUser funcionan", async () => {
    const fakeUser = { id: "123" };
    User.findById.mockResolvedValue(fakeUser);

    const done = jest.fn();
    passport._serializers[0](fakeUser, done);
    expect(done).toHaveBeenCalledWith(null, "123");

    const done2 = jest.fn();
    await passport._deserializers[0]("123", done2);
    expect(done2).toHaveBeenCalledWith(null, fakeUser);
  });

  test("GoogleStrategy maneja error en DB", async () => {
    const error = new Error("DB down");
    User.findOne.mockRejectedValue(error);

    const profile = { displayName: "User", emails: [{ value: "g@test.com" }] };
    const done = jest.fn();
    const strategy = passport._strategies.google;

    await strategy._verify("token", "refresh", profile, done);

    expect(done).toHaveBeenCalledWith(error, null);
  });

  test("MicrosoftStrategy maneja error en DB", async () => {
    const error = new Error("DB fail");
    User.findOne.mockRejectedValue(error);

    const profile = {
      displayName: "MS User",
      _json: { preferred_username: "ms@test.com" },
    };

    const done = jest.fn();
    const strategy = passport._strategies["azuread-openidconnect"];

    await strategy._verify("iss", "sub", profile, "token", "refresh", done);

    expect(done).toHaveBeenCalledWith(error, null);
  });
});
