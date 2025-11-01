// src/test/e2e/passport.e2e.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import passport from "passport";
import {
  resetDatabase,
  startE2EServer,
  stopE2EServer,
} from "../../../test/helpers/e2eServer.js";

let app;

beforeAll(async () => {
  ({ app } = await startE2EServer({
    env: {
      GOOGLE_CLIENT_ID: "fake-client-id",
      GOOGLE_CLIENT_SECRET: "fake-client-secret",
      GOOGLE_CALLBACK_URL: "http://localhost:4000/auth/google/callback",
    },
  }));
});

afterAll(async () => {
  await stopE2EServer();
});

beforeEach(async () => {
  await resetDatabase();
});

describe("Passport integration (JWT + Session)", () => {
  test("rechaza acceso sin token", async () => {
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "No token provided");
  });

  test("rechaza acceso con token inválido", async () => {
    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Token inválido o expirado");
  });

  test("permite acceso con token válido", async () => {
    const token = jwt.sign(
      { id: "123", email: "jwt@test.com" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      user: expect.objectContaining({ email: "jwt@test.com" }),
    });
  });

  test("serialize/deserialize mantiene sesión con dummy strategy", async () => {
    const agent = request.agent(app);

    // login con dummy strategy → crea usuario real en Mongo
    const login = await agent.post("/auth/test-login");
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({
      username: "tester",
      email: "tester@test.com",
    });

    // ahora la sesión debe persistir
    const res = await agent.get("/session/protected");
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "tester",
      email: "tester@test.com",
    });
  });
});

describe("Passport Google OAuth integration (mocked)", () => {
  test("mockea callback de Google y procesa usuario", async () => {
    const strategy = passport._strategies.google;
    expect(strategy).toBeDefined();

    const done = jest.fn();
    await strategy._verify(
      "accesstoken",
      "refreshtoken",
      {
        displayName: "Google Tester",
        emails: [{ value: "google@test.com" }],
        photos: [{ value: "http://photo.test/google.png" }],
      },
      done
    );

    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: "google@test.com",
        provider: "google",
      })
    );
  });
});
