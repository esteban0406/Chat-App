// src/server.js
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import jwt from "jsonwebtoken";

import { setupSocket, getIO } from "./sockets/index.js";
import { requestLogger, unknownEndpoint, errorHandler } from "./utils/middleware.js";
import "./config/passport.js";

import authRoutes from "./routes/auth.routes.js";     
import oauthRoutes from "./routes/oauth.routes.js";  
import voiceRoutes from "./routes/voice.routes.js";
import registerUserService, {
  registerFriendRequestService,
} from "./services/user/index.js";
import registerServerService, {
  registerServerInviteService,
} from "./services/server/index.js";
import registerChannelService from "./services/channel/index.js";
import registerMessageService from "./services/message/index.js";

import { corsConfig, MONGODB_URI, PORT, NODE_ENV } from "./config/config.js";

export async function createServer(options = {}) {
  const { extraRoutes } = options;
  const app = express();
  const server = http.createServer(app);

  // =======================
  // 🔧 Middlewares base
  // =======================
  app.use(cors(corsConfig));
  app.options(/.*/, cors(corsConfig)); // ✅ handle preflight globally
  app.use(express.json());
  app.use(requestLogger);

  // =======================
  // 🪪 Passport + Session
  // =======================
  app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
  app.use(passport.initialize());
  app.use(passport.session());

  // =======================
  // 🧠 Conexión a MongoDB
  // =======================
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(
      NODE_ENV === "test"
        ? "🧪 Connected to MongoMemoryServer"
        : "✅ Connected to MongoDB"
    );
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }

  // =======================
  // 🔌 Configuración Sockets
  // =======================
  setupSocket(server);
  const io = getIO();

  // =======================
  // 📡 Rutas REST API (JSON)
  // =======================
  app.use("/api/auth", authRoutes);
  registerUserService(app);
  registerServerService(app);
  registerServerInviteService(app);
  registerChannelService(app);
  registerMessageService(app, { io });
  registerFriendRequestService(app);
  app.use("/api/voice", voiceRoutes);
  app.use("/auth", oauthRoutes);

  // =======================
  // 🧪 Rutas de test (solo NODE_ENV=test)
  // =======================
  if (NODE_ENV === "test") {
    const jwt = await import("jsonwebtoken").then((m) => m.default);
    const User = (await import("./services/user/User.model.js")).default;

    app.post("/auth/test-login", async (req, res, next) => {
      try {
        let user = await User.findOne({ email: "tester@test.com" });
        if (!user) {
          user = await User.create({
            username: "tester",
            email: "tester@test.com",
            password: "hashedpass",
            avatar: null,
            provider: "local",
          });
        }

        req.login(user, (err) => {
          if (err) return next(err);
          res.json({ message: "ok", user });
        });
      } catch (err) {
        next(err);
      }
    });

    app.get("/api/protected", (req, res) => {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: "No token provided" });
      const token = auth.split(" ")[1];
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ ok: true, user: payload });
      } catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }
    });

    app.get("/session/protected", (req, res) => {
      if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
        return res.json({ user: req.user });
      }
      return res.status(401).json({ error: "Not authenticated" });
    });
  }

  if (typeof extraRoutes === "function") {
    extraRoutes(app);
  }

  // =======================
  // 🌍 Root & Error Handlers
  // =======================
  app.get("/", (req, res) => res.send("API funcionando 🚀"));
  app.use(unknownEndpoint);
  app.use(errorHandler);

  return { app, server };
}

export async function startServer(createServerFn = createServer) {
  const { server } = await createServerFn();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  process.once("SIGINT", async () => {
    console.log("🛑 Shutting down...");
    await mongoose.disconnect();
    server.close(() => {
      console.log("👋 Server closed gracefully");
      process.exit(0);
    });
  });
}
