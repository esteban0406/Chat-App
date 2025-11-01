import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

import { setupSocket, getIO } from "./sockets/index.js";
import {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} from "./utils/middleware.js";

import passport from "passport";
import session from "express-session";
import "./config/passport.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import serverRoutes from "./routes/server.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import createMessageRoutes from "./routes/message.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import serverInviteRoutes from "./routes/serverInvite.routes.js";
import voiceRoutes from "./routes/voice.routes.js";

import { corsConfig, MONGODB_URI, PORT, NODE_ENV } from "./config/config.js";

export async function createServer(options = {}) {
  const { extraRoutes } = options;
  const app = express();
  const server = http.createServer(app);

  // Middlewares
  app.use(cors(corsConfig));
  app.options(/.*/, cors(corsConfig)); // ✅ handle preflight globally
  app.use(express.json());
  app.use(requestLogger);

  // Passport middleware
  app.use(
    session({ secret: "secret", resave: false, saveUninitialized: true })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // DB connection
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

  // Sockets
  setupSocket(server);
  const io = getIO();

  // REST routes
  app.use("/auth", authRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/servers", serverRoutes);
  app.use("/api/channels", channelRoutes);
  app.use("/api/messages", createMessageRoutes(io));
  app.use("/api/friends", friendRoutes);
  app.use("/api/invites", serverInviteRoutes);
  app.use("/api/voice", voiceRoutes);

  if (typeof extraRoutes === "function") {
    extraRoutes(app);
  }

  // ✅ Solo en test: rutas y estrategia dummy para Passport

  if (NODE_ENV === "test") {
    const jwt = await import("jsonwebtoken").then((m) => m.default);
    const User = (await import("./models/User.js")).default;

    app.post("/auth/test-login", async (req, res, next) => {
      try {
        let user = await User.findOne({ email: "tester@test.com" });
        if (!user) {
          user = await User.create({
            username: "tester",
            email: "tester@test.com",
            password: "hashedpass", // requerido
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

    app.get("/session/protected", (req, res) => {
      if (req.isAuthenticated()) {
        return res.json({ user: req.user });
      }
      return res.status(401).json({ error: "Unauthorized" });
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
  }

  // Root
  app.get("/", (req, res) => res.send("API funcionando 🚀"));

  // Error handlers
  app.use(unknownEndpoint);
  app.use(errorHandler);

  return { app, server };
}

export async function startServer(createServerFn = createServer) {
  const { server } = await createServerFn();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const handleSigint = async () => {
    console.log("🛑 Shutting down...");
    await mongoose.disconnect();
    server.close(() => {
      console.log("👋 Server closed gracefully");
      process.exit(0);
    });
  };

  process.once("SIGINT", handleSigint);
}
